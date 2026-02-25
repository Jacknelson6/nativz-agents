import type { ProviderRegistry } from "./provider-registry.js";
import type { CostTracker } from "./cost-tracker.js";

// ─── Keep backward-compatible exports ───

export type TaskComplexity = "simple" | "moderate" | "complex";

export interface ModelConfig {
  primary: string;
  fast: string;
}

const DEFAULT_CONFIG: ModelConfig = {
  primary: "claude-3-5-sonnet-latest",
  fast: "claude-3-5-haiku-latest",
};

/** Backward-compatible: simple model selection */
export function selectModel(
  complexity: TaskComplexity,
  config: ModelConfig = DEFAULT_CONFIG
): string {
  return complexity === "complex" || complexity === "moderate"
    ? config.primary
    : config.fast;
}

/** Backward-compatible: basic complexity classification */
export function classifyComplexity(message: string): TaskComplexity {
  const complexIndicators = [
    "analyze", "audit", "strategy", "plan", "compare", "evaluate",
    "research", "investigate", "explain why", "deep dive", "comprehensive",
    "optimize", "architecture", "design", "review",
  ];
  const moderateIndicators = [
    "summarize", "list", "describe", "how to", "what is", "tell me about",
    "help me", "create", "write", "draft",
  ];
  const lower = message.toLowerCase();
  const complexMatches = complexIndicators.filter((i) => lower.includes(i)).length;
  const moderateMatches = moderateIndicators.filter((i) => lower.includes(i)).length;

  if (complexMatches >= 2 || message.length > 500) return "complex";
  if (complexMatches >= 1 || moderateMatches >= 2 || message.length > 200) return "moderate";
  return "simple";
}

// ─── Advanced Router ───

export interface RoutingSignals {
  messageLength: number;
  conversationDepth: number;
  hasToolNeeds: boolean;
  agentType?: string;
  userOverrideProvider?: string;
  userOverrideModel?: string;
  keywords: string[];
}

export interface RoutingDecision {
  provider: string;
  model: string;
  complexity: TaskComplexity;
  reason: string;
}

interface ProviderPreference {
  provider: string;
  model: string;
  priority: number;
}

const COMPLEXITY_KEYWORDS: Record<TaskComplexity, string[]> = {
  complex: [
    "analyze", "audit", "strategy", "plan", "compare", "evaluate",
    "research", "investigate", "deep dive", "comprehensive", "optimize",
    "architecture", "design", "review", "debug", "refactor", "migrate",
  ],
  moderate: [
    "summarize", "describe", "explain", "create", "write", "draft",
    "help me", "how to", "build", "implement", "fix",
  ],
  simple: [
    "hi", "hello", "thanks", "yes", "no", "ok", "what time", "list",
  ],
};

function computeComplexity(signals: RoutingSignals): TaskComplexity {
  let score = 0;

  // Message length
  if (signals.messageLength > 500) score += 3;
  else if (signals.messageLength > 200) score += 1;

  // Keywords
  const lower = signals.keywords.join(" ").toLowerCase();
  for (const kw of COMPLEXITY_KEYWORDS.complex) {
    if (lower.includes(kw)) score += 2;
  }
  for (const kw of COMPLEXITY_KEYWORDS.moderate) {
    if (lower.includes(kw)) score += 1;
  }

  // Conversation depth
  if (signals.conversationDepth > 20) score += 2;
  else if (signals.conversationDepth > 10) score += 1;

  // Tool needs
  if (signals.hasToolNeeds) score += 2;

  if (score >= 6) return "complex";
  if (score >= 3) return "moderate";
  return "simple";
}

const TIER_MAP: Record<TaskComplexity, ProviderPreference[]> = {
  complex: [
    { provider: "anthropic", model: "claude-opus-4-20250514", priority: 1 },
    { provider: "openai", model: "gpt-4o", priority: 2 },
    { provider: "gemini", model: "gemini-2.5-pro-preview-05-06", priority: 3 },
    { provider: "openrouter", model: "anthropic/claude-opus-4-20250514", priority: 4 },
  ],
  moderate: [
    { provider: "anthropic", model: "claude-sonnet-4-20250514", priority: 1 },
    { provider: "openai", model: "gpt-4o", priority: 2 },
    { provider: "gemini", model: "gemini-2.5-flash-preview-05-20", priority: 3 },
    { provider: "ollama", model: "qwen2.5-coder:7b", priority: 4 },
  ],
  simple: [
    { provider: "anthropic", model: "claude-haiku-4-5-20241022", priority: 1 },
    { provider: "openai", model: "gpt-4o-mini", priority: 2 },
    { provider: "gemini", model: "gemini-2.5-flash-preview-05-20", priority: 3 },
    { provider: "ollama", model: "llama3.2:3b", priority: 4 },
  ],
};

export class SmartRouter {
  constructor(
    private registry: ProviderRegistry,
    private costTracker: CostTracker
  ) {}

  route(message: string, conversationDepth: number, toolCount: number, agentType?: string): RoutingDecision {
    const signals: RoutingSignals = {
      messageLength: message.length,
      conversationDepth,
      hasToolNeeds: toolCount > 0,
      agentType,
      keywords: message.split(/\s+/),
    };

    return this.routeWithSignals(signals);
  }

  routeWithSignals(signals: RoutingSignals): RoutingDecision {
    // User override
    if (signals.userOverrideProvider && signals.userOverrideModel) {
      return {
        provider: signals.userOverrideProvider,
        model: signals.userOverrideModel,
        complexity: "complex",
        reason: "User override",
      };
    }

    const complexity = computeComplexity(signals);
    const candidates = TIER_MAP[complexity];

    // Prefer subscription providers (free)
    for (const candidate of candidates) {
      if (this.costTracker.isSubscriptionProvider(candidate.provider)) {
        if (this.registry.has(candidate.provider)) {
          return {
            provider: candidate.provider,
            model: candidate.model,
            complexity,
            reason: `Subscription provider preferred (${complexity})`,
          };
        }
      }
    }

    // Budget check — prefer cheaper if over budget
    if (!this.costTracker.isWithinBudget()) {
      // Try ollama first (free)
      if (this.registry.has("ollama")) {
        const ollamaModel = complexity === "complex" ? "qwen2.5-coder:7b" : "llama3.2:3b";
        return {
          provider: "ollama",
          model: ollamaModel,
          complexity,
          reason: "Budget exceeded, using local model",
        };
      }
    }

    // Latency-aware: prefer lower latency if available
    let bestCandidate: ProviderPreference | undefined;
    for (const candidate of candidates) {
      if (this.registry.has(candidate.provider)) {
        bestCandidate = candidate;
        break;
      }
    }

    if (bestCandidate) {
      return {
        provider: bestCandidate.provider,
        model: bestCandidate.model,
        complexity,
        reason: `Best available for ${complexity} task`,
      };
    }

    // Ultimate fallback
    return {
      provider: "anthropic",
      model: DEFAULT_CONFIG.fast,
      complexity: "simple",
      reason: "Fallback default",
    };
  }
}
