/**
 * Multi-agent handoff chains.
 * Enables one agent to hand off a task to another, preserving context.
 */

import type { AgentManifest } from "./loader.js";
import type { AgentRuntime } from "./runtime.js";

export interface HandoffRequest {
  fromAgent: string;
  toAgent: string;
  context: string;
  task: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface HandoffResult {
  response: string;
  fromAgent: string;
  toAgent: string;
  task: string;
  timestamp: number;
  durationMs: number;
}

export interface HandoffHistoryEntry {
  request: HandoffRequest;
  result: HandoffResult;
}

export class AgentHandoff {
  private history: HandoffHistoryEntry[] = [];
  private runtimeFactory: (agentId: string) => Promise<AgentRuntime>;

  constructor(runtimeFactory: (agentId: string) => Promise<AgentRuntime>) {
    this.runtimeFactory = runtimeFactory;
  }

  /**
   * Execute a handoff from one agent to another.
   * Spins up the target agent runtime, injects context, and runs the task.
   */
  async handoff(request: HandoffRequest): Promise<HandoffResult> {
    const startTime = Date.now();

    // Build the target agent runtime
    const targetRuntime = await this.runtimeFactory(request.toAgent);

    // Start a fresh conversation on the target agent
    targetRuntime.startConversation();

    // Build a context-injection message that includes handoff info
    const handoffContext = this.buildHandoffMessage(request);

    // Send the handoff message to the target agent
    const response = await targetRuntime.sendMessage(handoffContext);

    const result: HandoffResult = {
      response,
      fromAgent: request.fromAgent,
      toAgent: request.toAgent,
      task: request.task,
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
    };

    this.history.push({ request, result });

    // Shut down the temporary runtime
    await targetRuntime.shutdown();

    return result;
  }

  /**
   * Build a message that provides the target agent with handoff context.
   */
  private buildHandoffMessage(request: HandoffRequest): string {
    const recentHistory = request.conversationHistory.slice(-10);
    const historyText = recentHistory
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    return [
      `[HANDOFF from ${request.fromAgent}]`,
      "",
      `Task: ${request.task}`,
      "",
      `Context: ${request.context}`,
      "",
      "Recent conversation:",
      historyText,
      "",
      `Please complete this task. You are now handling this on behalf of the ${request.fromAgent} agent.`,
    ].join("\n");
  }

  /**
   * Get the full handoff history chain.
   */
  getHistory(): readonly HandoffHistoryEntry[] {
    return this.history;
  }

  /**
   * Get handoffs originating from a specific agent.
   */
  getHandoffsFrom(agentId: string): HandoffHistoryEntry[] {
    return this.history.filter((h) => h.request.fromAgent === agentId);
  }

  /**
   * Get handoffs targeting a specific agent.
   */
  getHandoffsTo(agentId: string): HandoffHistoryEntry[] {
    return this.history.filter((h) => h.request.toAgent === agentId);
  }

  /**
   * Clear handoff history.
   */
  clearHistory(): void {
    this.history = [];
  }
}
