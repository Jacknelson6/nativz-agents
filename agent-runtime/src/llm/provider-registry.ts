import type {
  LlmProvider,
  ProviderHealth,
  ModelInfo,
  UnifiedLlmRequest,
  UnifiedLlmResponse,
  UnifiedStreamCallbacks,
} from "./providers/types.js";

export interface FallbackChainEntry {
  providerName: string;
  modelId: string;
}

export class ProviderRegistry {
  private providers: Map<string, LlmProvider> = new Map();
  private healthCache: Map<string, ProviderHealth> = new Map();
  private healthCacheTime: Map<string, number> = new Map();
  private static HEALTH_TTL_MS = 60_000; // 60 seconds
  private fallbackChain: FallbackChainEntry[] = [];
  private latencyHistory: Map<string, number[]> = new Map();

  register(provider: LlmProvider): void {
    this.providers.set(provider.name, provider);
  }

  unregister(name: string): void {
    this.providers.delete(name);
    this.healthCache.delete(name);
    this.healthCacheTime.delete(name);
  }

  get(name: string): LlmProvider | undefined {
    return this.providers.get(name);
  }

  getAll(): LlmProvider[] {
    return Array.from(this.providers.values());
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }

  setFallbackChain(chain: FallbackChainEntry[]): void {
    this.fallbackChain = chain;
  }

  getFallbackChain(): FallbackChainEntry[] {
    return this.fallbackChain;
  }

  listAllModels(): Array<ModelInfo & { provider: string }> {
    const models: Array<ModelInfo & { provider: string }> = [];
    for (const provider of this.providers.values()) {
      for (const model of provider.listModels()) {
        models.push({ ...model, provider: provider.name });
      }
    }
    return models;
  }

  findProviderForModel(modelId: string): LlmProvider | undefined {
    for (const provider of this.providers.values()) {
      if (provider.listModels().some((m) => m.id === modelId)) {
        return provider;
      }
    }
    return undefined;
  }

  recordLatency(providerName: string, latencyMs: number): void {
    const history = this.latencyHistory.get(providerName) ?? [];
    history.push(latencyMs);
    if (history.length > 100) history.shift();
    this.latencyHistory.set(providerName, history);
  }

  getAverageLatency(providerName: string): number | undefined {
    const history = this.latencyHistory.get(providerName);
    if (!history?.length) return undefined;
    return history.reduce((a, b) => a + b, 0) / history.length;
  }

  async healthCheckAll(force = false): Promise<Map<string, ProviderHealth>> {
    const results = new Map<string, ProviderHealth>();
    const now = Date.now();
    const checks = Array.from(this.providers.entries()).map(async ([name, provider]) => {
      // Skip if recently checked and not forced
      if (!force) {
        const lastCheck = this.healthCacheTime.get(name);
        if (lastCheck && now - lastCheck < ProviderRegistry.HEALTH_TTL_MS) {
          const cached = this.healthCache.get(name);
          if (cached) {
            results.set(name, cached);
            return;
          }
        }
      }
      const health = await provider.healthCheck();
      this.healthCache.set(name, health);
      this.healthCacheTime.set(name, now);
      results.set(name, health);
    });
    await Promise.allSettled(checks);
    return results;
  }

  getCachedHealth(name: string): ProviderHealth | undefined {
    return this.healthCache.get(name);
  }

  async callWithFallback(
    request: UnifiedLlmRequest,
    preferredProvider?: string,
    callbacks?: UnifiedStreamCallbacks,
    stream = false
  ): Promise<UnifiedLlmResponse> {
    // Try preferred provider first
    if (preferredProvider) {
      const provider = this.providers.get(preferredProvider);
      if (provider) {
        try {
          const response = stream
            ? await provider.streamCall(request, callbacks)
            : await provider.call(request);
          this.recordLatency(preferredProvider, response.latencyMs);
          return response;
        } catch (err) {
          console.error(`Provider ${preferredProvider} failed:`, err);
        }
      }
    }

    // Try fallback chain
    for (const entry of this.fallbackChain) {
      const provider = this.providers.get(entry.providerName);
      if (!provider) continue;

      try {
        const fallbackRequest = { ...request, model: entry.modelId };
        const response = stream
          ? await provider.streamCall(fallbackRequest, callbacks)
          : await provider.call(fallbackRequest);
        this.recordLatency(entry.providerName, response.latencyMs);
        return response;
      } catch (err) {
        console.error(`Fallback provider ${entry.providerName} failed:`, err);
      }
    }

    throw new Error("All providers failed. No response available.");
  }
}
