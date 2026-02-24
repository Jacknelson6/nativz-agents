/**
 * Agent Workflow Chains — deterministic multi-step workflows with conditional branching.
 */

import { randomUUID } from "node:crypto";
import type { AgentManifest } from "./loader.js";

// ── Types ──────────────────────────────────────────────────────────────────

export type StepKind = "llm" | "tool" | "sub-agent" | "transform" | "gate";

export interface ChainStepResult {
  success: boolean;
  output: unknown;
  metadata?: Record<string, unknown>;
  durationMs: number;
}

export interface ChainStep {
  id: string;
  name: string;
  kind: StepKind;
  /** For 'llm': prompt template ({{input}} replaced). For 'tool': tool name. For 'sub-agent': agent id. */
  target: string;
  /** Extra params passed to tool / sub-agent */
  params?: Record<string, unknown>;
  /** Transform fn body (receives `input`, returns value). Only for kind=transform. */
  transformFn?: string;
  /** If set, on failure jump to step with this id instead of failing the chain. */
  fallbackStepId?: string;
  /** Gate condition: JS expression evaluated against previous step output. Skips if false. */
  condition?: string;
  /** Timeout in ms for this step. Default 60_000. */
  timeoutMs?: number;
}

export type ChainStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface ChainProgress {
  chainId: string;
  chainName: string;
  status: ChainStatus;
  currentStepIndex: number;
  totalSteps: number;
  currentStepName: string;
  stepResults: Array<{ stepId: string; stepName: string; status: ChainStatus; result?: ChainStepResult }>;
  startedAt: number;
  completedAt?: number;
  finalOutput?: unknown;
  error?: string;
}

export interface ChainDefinition {
  id: string;
  name: string;
  description: string;
  agentId?: string;
  steps: ChainStep[];
  tags?: string[];
}

// ── Step Executors (pluggable) ─────────────────────────────────────────────

export type StepExecutor = (
  step: ChainStep,
  input: unknown,
  context: ChainExecutionContext,
) => Promise<ChainStepResult>;

export interface ChainExecutionContext {
  agentId: string;
  conversationId?: string;
  /** Accumulated outputs keyed by step id */
  outputs: Record<string, unknown>;
  /** Abort signal */
  signal: AbortSignal;
}

// ── Chain Class ────────────────────────────────────────────────────────────

export class Chain {
  public readonly definition: ChainDefinition;

  constructor(definition: ChainDefinition) {
    this.definition = definition;
  }

  get id(): string {
    return this.definition.id;
  }
  get name(): string {
    return this.definition.name;
  }
  get steps(): ChainStep[] {
    return this.definition.steps;
  }
}

// ── Chain Executor ─────────────────────────────────────────────────────────

export class ChainExecutor {
  private executors: Map<StepKind, StepExecutor> = new Map();
  private activeRuns: Map<string, { progress: ChainProgress; controller: AbortController }> = new Map();

  registerExecutor(kind: StepKind, executor: StepExecutor): void {
    this.executors.set(kind, executor);
  }

  /** Subscribe to progress updates (simple callback). */
  private listeners: Array<(progress: ChainProgress) => void> = [];
  onProgress(cb: (progress: ChainProgress) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private emit(progress: ChainProgress): void {
    for (const cb of this.listeners) {
      try {
        cb(progress);
      } catch {
        /* ignore listener errors */
      }
    }
  }

  getProgress(chainId: string): ChainProgress | undefined {
    return this.activeRuns.get(chainId)?.progress;
  }

  cancel(chainId: string): boolean {
    const run = this.activeRuns.get(chainId);
    if (!run) return false;
    run.controller.abort();
    run.progress.status = "cancelled";
    this.emit(run.progress);
    return true;
  }

  async execute(chain: Chain, initialInput: unknown, agentId: string, conversationId?: string): Promise<ChainProgress> {
    const runId = chain.id + ":" + randomUUID().slice(0, 8);
    const controller = new AbortController();

    const progress: ChainProgress = {
      chainId: runId,
      chainName: chain.name,
      status: "running",
      currentStepIndex: 0,
      totalSteps: chain.steps.length,
      currentStepName: chain.steps[0]?.name ?? "",
      stepResults: chain.steps.map((s) => ({ stepId: s.id, stepName: s.name, status: "pending" as ChainStatus })),
      startedAt: Date.now(),
    };
    this.activeRuns.set(runId, { progress, controller });
    this.emit(progress);

    const context: ChainExecutionContext = {
      agentId,
      conversationId,
      outputs: {},
      signal: controller.signal,
    };

    let currentInput = initialInput;

    for (let i = 0; i < chain.steps.length; i++) {
      if (controller.signal.aborted) break;

      const step = chain.steps[i];
      progress.currentStepIndex = i;
      progress.currentStepName = step.name;
      progress.stepResults[i].status = "running";
      this.emit(progress);

      // Gate condition check
      if (step.condition) {
        try {
          const condFn = new Function("input", "outputs", `return Boolean(${step.condition})`);
          const shouldRun = condFn(currentInput, context.outputs) as boolean;
          if (!shouldRun) {
            progress.stepResults[i].status = "completed";
            progress.stepResults[i].result = { success: true, output: currentInput, durationMs: 0 };
            context.outputs[step.id] = currentInput;
            continue;
          }
        } catch {
          // If condition eval fails, run the step anyway
        }
      }

      const executor = this.executors.get(step.kind);
      if (!executor) {
        const err = `No executor registered for step kind: ${step.kind}`;
        progress.stepResults[i].status = "failed";
        progress.status = "failed";
        progress.error = err;
        progress.completedAt = Date.now();
        this.emit(progress);
        return progress;
      }

      try {
        const result = await executor(step, currentInput, context);
        progress.stepResults[i].result = result;

        if (result.success) {
          progress.stepResults[i].status = "completed";
          currentInput = result.output;
          context.outputs[step.id] = result.output;
        } else {
          // Attempt fallback
          if (step.fallbackStepId) {
            const fallbackIdx = chain.steps.findIndex((s) => s.id === step.fallbackStepId);
            if (fallbackIdx !== -1 && fallbackIdx > i) {
              progress.stepResults[i].status = "failed";
              // Skip to fallback step (loop will increment i)
              i = fallbackIdx - 1;
              continue;
            }
          }
          progress.stepResults[i].status = "failed";
          progress.status = "failed";
          progress.error = `Step "${step.name}" failed`;
          progress.completedAt = Date.now();
          this.emit(progress);
          return progress;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        progress.stepResults[i].status = "failed";

        if (step.fallbackStepId) {
          const fallbackIdx = chain.steps.findIndex((s) => s.id === step.fallbackStepId);
          if (fallbackIdx !== -1 && fallbackIdx > i) {
            i = fallbackIdx - 1;
            continue;
          }
        }

        progress.status = "failed";
        progress.error = errorMsg;
        progress.completedAt = Date.now();
        this.emit(progress);
        return progress;
      }
    }

    if (progress.status === "running") {
      progress.status = controller.signal.aborted ? "cancelled" : "completed";
    }
    progress.finalOutput = currentInput;
    progress.completedAt = Date.now();
    this.emit(progress);
    this.activeRuns.delete(runId);
    return progress;
  }
}

// ── Built-in Step Executors ────────────────────────────────────────────────

/** Transform executor — runs a JS function body synchronously */
export const transformExecutor: StepExecutor = async (step, input) => {
  const start = Date.now();
  try {
    const fn = new Function("input", step.transformFn ?? "return input");
    const output = fn(input) as unknown;
    return { success: true, output, durationMs: Date.now() - start };
  } catch (err) {
    return { success: false, output: null, durationMs: Date.now() - start, metadata: { error: String(err) } };
  }
};

// ── Chain Templates (ship pre-built per agent) ─────────────────────────────

export const CHAIN_TEMPLATES: Record<string, ChainDefinition[]> = {
  "content-editor": [
    {
      id: "content-review",
      name: "Content Review Pipeline",
      description: "Generate draft → fact-check → brand voice → format for platform",
      agentId: "content-editor",
      tags: ["content", "review"],
      steps: [
        { id: "draft", name: "Generate Draft", kind: "llm", target: "Write a draft based on: {{input}}" },
        { id: "fact-check", name: "Fact Check", kind: "llm", target: "Fact-check the following content and flag any inaccuracies:\n\n{{input}}" },
        { id: "brand-voice", name: "Brand Voice Check", kind: "llm", target: "Review this content for brand voice consistency. Suggest edits:\n\n{{input}}" },
        { id: "format", name: "Format for Platform", kind: "llm", target: "Format this content for social media publishing:\n\n{{input}}" },
      ],
    },
    {
      id: "blog-pipeline",
      name: "Blog Post Pipeline",
      description: "Research → outline → draft → SEO optimize → final edit",
      agentId: "content-editor",
      tags: ["blog", "seo"],
      steps: [
        { id: "research", name: "Research Topic", kind: "llm", target: "Research the following topic and provide key points:\n\n{{input}}" },
        { id: "outline", name: "Create Outline", kind: "llm", target: "Create a detailed blog post outline from this research:\n\n{{input}}" },
        { id: "draft", name: "Write Draft", kind: "llm", target: "Write a full blog post from this outline:\n\n{{input}}" },
        { id: "seo", name: "SEO Optimize", kind: "sub-agent", target: "seo", params: { task: "optimize" } },
        { id: "final-edit", name: "Final Edit", kind: "llm", target: "Do a final editorial pass on this blog post:\n\n{{input}}" },
      ],
    },
  ],
  seo: [
    {
      id: "seo-audit",
      name: "SEO Audit Chain",
      description: "Crawl → analyze → keyword gaps → recommendations",
      agentId: "seo",
      tags: ["seo", "audit"],
      steps: [
        { id: "analyze", name: "Analyze Content", kind: "llm", target: "Analyze the following page content for SEO:\n\n{{input}}" },
        { id: "keywords", name: "Keyword Gap Analysis", kind: "llm", target: "Identify keyword gaps and opportunities:\n\n{{input}}" },
        { id: "recommendations", name: "Generate Recommendations", kind: "llm", target: "Generate actionable SEO recommendations:\n\n{{input}}" },
      ],
    },
  ],
  ads: [
    {
      id: "ad-creation",
      name: "Ad Creation Pipeline",
      description: "Brief → copy variants → review → A/B test setup",
      agentId: "ads",
      tags: ["ads", "creative"],
      steps: [
        { id: "brief", name: "Parse Brief", kind: "transform", target: "", transformFn: "return input" },
        { id: "copy", name: "Generate Copy Variants", kind: "llm", target: "Generate 3 ad copy variants for:\n\n{{input}}" },
        { id: "review", name: "Compliance Review", kind: "llm", target: "Review these ad copies for platform compliance:\n\n{{input}}" },
      ],
    },
  ],
  "account-manager": [
    {
      id: "client-report",
      name: "Client Report Generation",
      description: "Gather metrics → analyze → generate report → format",
      agentId: "account-manager",
      tags: ["reporting", "client"],
      steps: [
        { id: "gather", name: "Gather Metrics", kind: "llm", target: "Summarize the key metrics from:\n\n{{input}}" },
        { id: "analyze", name: "Analyze Performance", kind: "llm", target: "Analyze performance trends:\n\n{{input}}" },
        { id: "report", name: "Generate Report", kind: "llm", target: "Generate a professional client report:\n\n{{input}}" },
      ],
    },
  ],
};

export function getTemplatesForAgent(agentId: string): ChainDefinition[] {
  return CHAIN_TEMPLATES[agentId] ?? [];
}

export function getAllTemplates(): ChainDefinition[] {
  return Object.values(CHAIN_TEMPLATES).flat();
}
