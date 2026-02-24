/**
 * Cost tracking with configurable per-model pricing.
 */

import type { UsageTracker } from "./usage.js";

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

export interface ProviderConfig {
  subscription: boolean;
  models: Record<string, ModelPricing>;
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface UsageForCost {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

const DEFAULT_PRICING: Record<string, ProviderConfig> = {
  anthropic: {
    subscription: false,
    models: {
      "claude-opus-4-0-20250514": { inputPerMillion: 15, outputPerMillion: 75 },
      "claude-sonnet-4-20250514": { inputPerMillion: 3, outputPerMillion: 15 },
      "claude-haiku-3-5-20241022": { inputPerMillion: 0.8, outputPerMillion: 4 },
    },
  },
  openai: {
    subscription: false,
    models: {
      "gpt-4.1": { inputPerMillion: 2, outputPerMillion: 8 },
    },
  },
  google: {
    subscription: false,
    models: {
      "gemini-2.5-pro": { inputPerMillion: 1.25, outputPerMillion: 10 },
      "gemini-2.5-flash": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
    },
  },
};

export class CostTracker {
  private pricing: Record<string, ProviderConfig>;

  constructor(pricing?: Record<string, ProviderConfig>) {
    this.pricing = pricing ?? { ...DEFAULT_PRICING };
  }

  setPricing(provider: string, config: ProviderConfig): void {
    this.pricing[provider] = config;
  }

  calculateCost(usage: UsageForCost): CostBreakdown {
    const providerConfig = this.pricing[usage.provider];
    if (!providerConfig || providerConfig.subscription) {
      return { inputCost: 0, outputCost: 0, totalCost: 0 };
    }

    const modelPricing = providerConfig.models[usage.model];
    if (!modelPricing) {
      return { inputCost: 0, outputCost: 0, totalCost: 0 };
    }

    const inputCost = (usage.inputTokens / 1_000_000) * modelPricing.inputPerMillion;
    const outputCost = (usage.outputTokens / 1_000_000) * modelPricing.outputPerMillion;

    return { inputCost, outputCost, totalCost: inputCost + outputCost };
  }

  getDailyCost(usageTracker: UsageTracker, date?: string): CostBreakdown {
    const usage = usageTracker.getDailyUsage(date);
    // Without model breakdown from daily usage, return aggregate estimate
    // For precise costs, use calculateCost per-record
    return this.estimateFromTotals(usage.inputTokens, usage.outputTokens);
  }

  getMonthlyCost(usageTracker: UsageTracker, yearMonth?: string): CostBreakdown {
    const usage = usageTracker.getMonthlyUsage(yearMonth);
    return this.estimateFromTotals(usage.inputTokens, usage.outputTokens);
  }

  isOverBudget(usageTracker: UsageTracker, dailyLimit: number, date?: string): boolean {
    const cost = this.getDailyCost(usageTracker, date);
    return cost.totalCost > dailyLimit;
  }

  private estimateFromTotals(inputTokens: number, outputTokens: number): CostBreakdown {
    // Use a mid-range estimate when model is unknown (~Sonnet pricing)
    const inputCost = (inputTokens / 1_000_000) * 3;
    const outputCost = (outputTokens / 1_000_000) * 15;
    return { inputCost, outputCost, totalCost: inputCost + outputCost };
  }
}
