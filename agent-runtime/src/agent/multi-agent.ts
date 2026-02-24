/**
 * Multi-Agent Collaboration Orchestrator
 * Enables teams of specialized agents to work together on complex tasks.
 */

import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";

// ---- Types ----

export type CommunicationMode = "sequential" | "round-robin" | "directed" | "parallel";

export interface AgentRole {
  id: string;
  name: string;
  systemPrompt: string;
  capabilities: string[];
  /** If directed mode, which agents this one passes output to */
  downstream?: string[];
}

export interface TeamDefinition {
  id: string;
  name: string;
  description: string;
  agents: AgentRole[];
  communicationMode: CommunicationMode;
  /** Pipeline order for sequential mode */
  pipeline?: string[];
}

export interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent: string | "broadcast";
  content: string;
  type: "task" | "result" | "handoff" | "clarification" | "final";
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface SharedWorkingMemory {
  entries: Map<string, unknown>;
  set(key: string, value: unknown, author: string): void;
  get<T = unknown>(key: string): T | undefined;
  getAll(): Record<string, unknown>;
  getHistory(): SharedMemoryEntry[];
}

export interface SharedMemoryEntry {
  key: string;
  value: unknown;
  author: string;
  timestamp: number;
}

export interface AgentExecutor {
  (agentRole: AgentRole, input: string, context: AgentExecutionContext): Promise<string>;
}

export interface AgentExecutionContext {
  teamId: string;
  runId: string;
  sharedMemory: SharedWorkingMemory;
  previousOutputs: AgentMessage[];
  allMessages: AgentMessage[];
}

export interface OrchestratorEvents {
  "agent:start": { runId: string; agentId: string; input: string };
  "agent:complete": { runId: string; agentId: string; output: string; durationMs: number };
  "agent:error": { runId: string; agentId: string; error: string };
  "handoff": { runId: string; from: string; to: string; summary: string };
  "run:start": { runId: string; teamId: string; task: string };
  "run:complete": { runId: string; report: ConsolidatedReport };
  "memory:update": { runId: string; key: string; author: string };
}

export interface AgentRunStatus {
  agentId: string;
  status: "pending" | "running" | "completed" | "error";
  startedAt?: number;
  completedAt?: number;
  output?: string;
  error?: string;
}

export interface ConsolidatedReport {
  runId: string;
  teamId: string;
  teamName: string;
  task: string;
  startedAt: number;
  completedAt: number;
  totalDurationMs: number;
  agentResults: Array<{
    agentId: string;
    agentName: string;
    output: string;
    durationMs: number;
  }>;
  sharedMemorySnapshot: Record<string, unknown>;
  combinedOutput: string;
}

// ---- Shared Working Memory Implementation ----

class SharedWorkingMemoryImpl implements SharedWorkingMemory {
  entries = new Map<string, unknown>();
  private history: SharedMemoryEntry[] = [];

  set(key: string, value: unknown, author: string): void {
    this.entries.set(key, value);
    this.history.push({ key, value, author, timestamp: Date.now() });
  }

  get<T = unknown>(key: string): T | undefined {
    return this.entries.get(key) as T | undefined;
  }

  getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of this.entries) result[k] = v;
    return result;
  }

  getHistory(): SharedMemoryEntry[] {
    return [...this.history];
  }
}

// ---- Multi-Agent Orchestrator ----

export class MultiAgentOrchestrator extends EventEmitter {
  private teams = new Map<string, TeamDefinition>();
  private executor: AgentExecutor;
  private activeRuns = new Map<string, Map<string, AgentRunStatus>>();

  constructor(executor: AgentExecutor) {
    super();
    this.executor = executor;
  }

  registerTeam(team: TeamDefinition): void {
    this.teams.set(team.id, team);
  }

  unregisterTeam(teamId: string): void {
    this.teams.delete(teamId);
  }

  getTeam(teamId: string): TeamDefinition | undefined {
    return this.teams.get(teamId);
  }

  listTeams(): TeamDefinition[] {
    return [...this.teams.values()];
  }

  getRunStatus(runId: string): AgentRunStatus[] | undefined {
    const statuses = this.activeRuns.get(runId);
    return statuses ? [...statuses.values()] : undefined;
  }

  async executeTeam(teamId: string, task: string): Promise<ConsolidatedReport> {
    const team = this.teams.get(teamId);
    if (!team) throw new Error(`Team "${teamId}" not found`);

    const runId = randomUUID();
    const sharedMemory = new SharedWorkingMemoryImpl();
    const allMessages: AgentMessage[] = [];
    const statusMap = new Map<string, AgentRunStatus>();
    this.activeRuns.set(runId, statusMap);

    for (const agent of team.agents) {
      statusMap.set(agent.id, { agentId: agent.id, status: "pending" });
    }

    sharedMemory.set("task", task, "orchestrator");
    sharedMemory.set("team", team.name, "orchestrator");

    this.emit("run:start", { runId, teamId, task });
    const startedAt = Date.now();

    const agentResults: ConsolidatedReport["agentResults"] = [];

    const runAgent = async (agent: AgentRole, input: string): Promise<string> => {
      const status = statusMap.get(agent.id)!;
      status.status = "running";
      status.startedAt = Date.now();
      this.emit("agent:start", { runId, agentId: agent.id, input });

      try {
        const previousOutputs = allMessages.filter(
          (m) => m.toAgent === agent.id || m.toAgent === "broadcast"
        );
        const context: AgentExecutionContext = {
          teamId,
          runId,
          sharedMemory,
          previousOutputs,
          allMessages: [...allMessages],
        };

        const output = await this.executor(agent, input, context);
        const durationMs = Date.now() - status.startedAt;

        status.status = "completed";
        status.completedAt = Date.now();
        status.output = output;

        const msg: AgentMessage = {
          id: randomUUID(),
          fromAgent: agent.id,
          toAgent: "broadcast",
          content: output,
          type: "result",
          timestamp: Date.now(),
        };
        allMessages.push(msg);
        sharedMemory.set(`result:${agent.id}`, output, agent.id);

        this.emit("agent:complete", { runId, agentId: agent.id, output, durationMs });
        agentResults.push({ agentId: agent.id, agentName: agent.name, output, durationMs });

        return output;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        status.status = "error";
        status.error = errorMsg;
        this.emit("agent:error", { runId, agentId: agent.id, error: errorMsg });
        throw err;
      }
    };

    switch (team.communicationMode) {
      case "sequential": {
        const order = team.pipeline ?? team.agents.map((a) => a.id);
        let currentInput = task;
        for (const agentId of order) {
          const agent = team.agents.find((a) => a.id === agentId);
          if (!agent) throw new Error(`Agent "${agentId}" not in team`);
          const nextAgentId = order[order.indexOf(agentId) + 1];
          const output = await runAgent(agent, currentInput);
          if (nextAgentId) {
            this.emit("handoff", { runId, from: agentId, to: nextAgentId, summary: output.slice(0, 200) });
          }
          currentInput = output;
        }
        break;
      }

      case "round-robin": {
        const rounds = 2;
        let currentInput = task;
        for (let round = 0; round < rounds; round++) {
          for (const agent of team.agents) {
            currentInput = await runAgent(agent, currentInput);
          }
        }
        break;
      }

      case "directed": {
        const visited = new Set<string>();
        const queue = [team.agents[0]];
        let currentInput = task;

        while (queue.length > 0) {
          const agent = queue.shift()!;
          if (visited.has(agent.id)) continue;
          visited.add(agent.id);

          const output = await runAgent(agent, currentInput);
          currentInput = output;

          if (agent.downstream) {
            for (const downId of agent.downstream) {
              const downstream = team.agents.find((a) => a.id === downId);
              if (downstream && !visited.has(downstream.id)) {
                this.emit("handoff", { runId, from: agent.id, to: downId, summary: output.slice(0, 200) });
                queue.push(downstream);
              }
            }
          }
        }
        break;
      }

      case "parallel": {
        await Promise.all(team.agents.map((agent) => runAgent(agent, task)));
        break;
      }
    }

    const completedAt = Date.now();
    const combinedOutput = agentResults
      .map((r) => `## ${r.agentName}\n\n${r.output}`)
      .join("\n\n---\n\n");

    const report: ConsolidatedReport = {
      runId,
      teamId,
      teamName: team.name,
      task,
      startedAt,
      completedAt,
      totalDurationMs: completedAt - startedAt,
      agentResults,
      sharedMemorySnapshot: sharedMemory.getAll(),
      combinedOutput,
    };

    this.activeRuns.delete(runId);
    this.emit("run:complete", { runId, report });

    return report;
  }
}

// ---- Pre-built Team Templates ----

export const TEAM_TEMPLATES = {
  marketingCampaign: (): TeamDefinition => ({
    id: "marketing-campaign",
    name: "Marketing Campaign Team",
    description: "SEO → Content → Ads pipeline for launching campaigns",
    communicationMode: "sequential",
    pipeline: ["seo-specialist", "content-editor", "ads-manager"],
    agents: [
      {
        id: "seo-specialist",
        name: "SEO Specialist",
        systemPrompt:
          "You are an SEO specialist. Analyze the task and provide keyword research, search intent analysis, and SEO strategy. Output structured data the content team can use.",
        capabilities: ["keyword-research", "serp-analysis", "competitor-analysis"],
        downstream: ["content-editor"],
      },
      {
        id: "content-editor",
        name: "Content Editor",
        systemPrompt:
          "You are a content editor. Using the SEO research provided, create compelling content pieces: blog posts, social captions, and email copy. Optimize for the target keywords.",
        capabilities: ["copywriting", "content-strategy", "brand-voice"],
        downstream: ["ads-manager"],
      },
      {
        id: "ads-manager",
        name: "Ads Manager",
        systemPrompt:
          "You are a paid media specialist. Using the SEO keywords and content created, design ad campaigns with targeting, budget allocation, and creative briefs for Google Ads and Meta Ads.",
        capabilities: ["google-ads", "meta-ads", "budget-optimization"],
      },
    ],
  }),

  researchTeam: (): TeamDefinition => ({
    id: "research-team",
    name: "Research & Analysis Team",
    description: "Parallel research with consolidation",
    communicationMode: "parallel",
    agents: [
      {
        id: "market-researcher",
        name: "Market Researcher",
        systemPrompt: "You research market trends, industry data, and competitive landscape.",
        capabilities: ["market-analysis", "trend-spotting"],
      },
      {
        id: "data-analyst",
        name: "Data Analyst",
        systemPrompt: "You analyze quantitative data, create projections, and identify patterns.",
        capabilities: ["data-analysis", "forecasting"],
      },
      {
        id: "strategist",
        name: "Strategist",
        systemPrompt: "You synthesize research into actionable strategy recommendations.",
        capabilities: ["strategy", "planning"],
      },
    ],
  }),
} as const;
