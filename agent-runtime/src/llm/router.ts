export type TaskComplexity = "simple" | "complex";

export interface ModelConfig {
  primary: string;
  fast: string;
}

const DEFAULT_CONFIG: ModelConfig = {
  primary: "claude-opus-4-20250514",
  fast: "claude-haiku-4-5-20241022",
};

export function selectModel(
  complexity: TaskComplexity,
  config: ModelConfig = DEFAULT_CONFIG
): string {
  return complexity === "complex" ? config.primary : config.fast;
}

export function classifyComplexity(message: string): TaskComplexity {
  const complexIndicators = [
    "analyze", "audit", "strategy", "plan", "compare", "evaluate",
    "research", "investigate", "explain why", "deep dive", "comprehensive",
    "optimize", "architecture", "design", "review",
  ];
  const lower = message.toLowerCase();
  const matches = complexIndicators.filter((i) => lower.includes(i));
  return matches.length >= 1 ? "complex" : "simple";
}
