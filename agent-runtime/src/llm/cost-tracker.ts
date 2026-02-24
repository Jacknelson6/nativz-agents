import type { ModelInfo } from "./providers/types.js";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

export interface ConversationUsage {
  conversationId: string;
  provider: string;
  model: string;
  totalInput: number;
  totalOutput: number;
  totalCost: number;
  callCount: number;
}

export interface BudgetConfig {
  dailyLimitUsd: number;
  monthlyLimitUsd: number;
  subscriptionMode: boolean;
  subscribedProviders: string[];
}

export class CostTracker {
  private conversationUsage: Map<string, ConversationUsage[]> = new Map();
  private dailyCosts: Map<string, number> = new Map();
  private monthlyCosts: Map<string, number> = new Map();
  private budget: BudgetConfig = {
    dailyLimitUsd: 50,
    monthlyLimitUsd: 500,
    subscriptionMode: false,
    subscribedProviders: [],
  };

  setBudget(config: Partial<BudgetConfig>): void {
    this.budget = { ...this.budget, ...config };
  }

  getBudget(): BudgetConfig {
    return { ...this.budget };
  }

  recordUsage(
    conversationId: string,
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    modelInfo?: ModelInfo
  ): TokenUsage {
    const cost = modelInfo
      ? (inputTokens / 1_000_000) * modelInfo.inputCostPer1M +
        (outputTokens / 1_000_000) * modelInfo.outputCostPer1M
      : 0;

    // Update conversation usage
    const convEntries = this.conversationUsage.get(conversationId) ?? [];
    const existing = convEntries.find(
      (e) => e.provider === provider && e.model === model
    );
    if (existing) {
      existing.totalInput += inputTokens;
      existing.totalOutput += outputTokens;
      existing.totalCost += cost;
      existing.callCount++;
    } else {
      convEntries.push({
        conversationId,
        provider,
        model,
        totalInput: inputTokens,
        totalOutput: outputTokens,
        totalCost: cost,
        callCount: 1,
      });
    }
    this.conversationUsage.set(conversationId, convEntries);

    // Update daily/monthly
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    this.dailyCosts.set(today, (this.dailyCosts.get(today) ?? 0) + cost);
    this.monthlyCosts.set(month, (this.monthlyCosts.get(month) ?? 0) + cost);

    return { inputTokens, outputTokens, estimatedCost: cost };
  }

  getDailyCost(date?: string): number {
    const key = date ?? new Date().toISOString().slice(0, 10);
    return this.dailyCosts.get(key) ?? 0;
  }

  getMonthlyCost(month?: string): number {
    const key = month ?? new Date().toISOString().slice(0, 7);
    return this.monthlyCosts.get(key) ?? 0;
  }

  isWithinBudget(): boolean {
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const daily = this.dailyCosts.get(today) ?? 0;
    const monthly = this.monthlyCosts.get(month) ?? 0;
    return daily < this.budget.dailyLimitUsd && monthly < this.budget.monthlyLimitUsd;
  }

  isSubscriptionProvider(provider: string): boolean {
    return this.budget.subscriptionMode && this.budget.subscribedProviders.includes(provider);
  }

  getConversationUsage(conversationId: string): ConversationUsage[] {
    return this.conversationUsage.get(conversationId) ?? [];
  }

  getConversationTotalCost(conversationId: string): number {
    const entries = this.conversationUsage.get(conversationId) ?? [];
    return entries.reduce((sum, e) => sum + e.totalCost, 0);
  }

  getSummary(): {
    todayCost: number;
    monthCost: number;
    dailyLimit: number;
    monthlyLimit: number;
    withinBudget: boolean;
    totalConversations: number;
  } {
    return {
      todayCost: this.getDailyCost(),
      monthCost: this.getMonthlyCost(),
      dailyLimit: this.budget.dailyLimitUsd,
      monthlyLimit: this.budget.monthlyLimitUsd,
      withinBudget: this.isWithinBudget(),
      totalConversations: this.conversationUsage.size,
    };
  }
}
