/**
 * Prompt caching and token optimization.
 * Tracks system prompt hashes for Anthropic prompt caching,
 * detects repeated context, and suggests optimizations.
 */

import * as crypto from "node:crypto";

export interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  estimatedTokensSaved: number;
}

export interface ContextOptimization {
  type: "duplicate_context" | "large_system_prompt" | "repeated_messages";
  description: string;
  estimatedSavings: number;
}

interface CacheEntry {
  hash: string;
  tokenCount: number;
  lastUsed: number;
  hitCount: number;
}

export class TokenCache {
  private systemPromptCache: Map<string, CacheEntry> = new Map();
  private contextHashes: Map<string, number> = new Map();
  private totalRequests = 0;
  private cacheHits = 0;
  private estimatedTokensSaved = 0;

  /**
   * Check if a system prompt is cached (unchanged from previous call).
   * Returns true if it's a cache hit (Anthropic can use prompt caching).
   */
  checkSystemPrompt(systemPrompt: string, model: string): boolean {
    this.totalRequests++;
    const hash = this.hash(systemPrompt);
    const cacheKey = `${model}:system`;
    const existing = this.systemPromptCache.get(cacheKey);

    if (existing && existing.hash === hash) {
      this.cacheHits++;
      existing.hitCount++;
      existing.lastUsed = Date.now();
      this.estimatedTokensSaved += existing.tokenCount;
      return true;
    }

    // Cache miss — store the new hash
    const estimatedTokens = Math.ceil(systemPrompt.length / 4);
    this.systemPromptCache.set(cacheKey, {
      hash,
      tokenCount: estimatedTokens,
      lastUsed: Date.now(),
      hitCount: 0,
    });

    return false;
  }

  /**
   * Detect duplicate context blocks across turns.
   * Returns deduplicated content and the number of duplicates found.
   */
  deduplicateContext(
    blocks: string[]
  ): { unique: string[]; duplicatesRemoved: number } {
    const seen = new Set<string>();
    const unique: string[] = [];
    let duplicatesRemoved = 0;

    for (const block of blocks) {
      const hash = this.hash(block);
      if (seen.has(hash)) {
        duplicatesRemoved++;
      } else {
        seen.add(hash);
        unique.push(block);
      }
    }

    return { unique, duplicatesRemoved };
  }

  /**
   * Track context usage patterns for optimization suggestions.
   */
  trackContextUsage(contextKey: string, tokenCount: number): void {
    const existing = this.contextHashes.get(contextKey) ?? 0;
    this.contextHashes.set(contextKey, existing + tokenCount);
  }

  /**
   * Get optimization suggestions based on usage patterns.
   */
  getOptimizations(): ContextOptimization[] {
    const optimizations: ContextOptimization[] = [];

    // Check for large repeated context blocks
    for (const [key, totalTokens] of this.contextHashes) {
      if (totalTokens > 10000) {
        optimizations.push({
          type: "large_system_prompt",
          description: `Context "${key}" has consumed ~${totalTokens} tokens total. Consider caching or compressing.`,
          estimatedSavings: Math.floor(totalTokens * 0.3),
        });
      }
    }

    // Check cache hit rate
    if (this.totalRequests > 10 && this.getStats().hitRate < 0.5) {
      optimizations.push({
        type: "duplicate_context",
        description: `Low cache hit rate (${Math.round(this.getStats().hitRate * 100)}%). System prompts may be changing too frequently.`,
        estimatedSavings: 0,
      });
    }

    return optimizations;
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    return {
      totalRequests: this.totalRequests,
      cacheHits: this.cacheHits,
      cacheMisses: this.totalRequests - this.cacheHits,
      hitRate: this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0,
      estimatedTokensSaved: this.estimatedTokensSaved,
    };
  }

  /**
   * Reset cache and stats.
   */
  reset(): void {
    this.systemPromptCache.clear();
    this.contextHashes.clear();
    this.totalRequests = 0;
    this.cacheHits = 0;
    this.estimatedTokensSaved = 0;
  }

  private hash(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
  }
}
