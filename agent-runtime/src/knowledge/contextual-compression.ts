/**
 * Context-aware chunk compression.
 * Compresses retrieved knowledge chunks to only the relevant parts
 * given a specific query, reducing token usage while maintaining relevance.
 */

export interface CompressedChunk {
  original: string;
  compressed: string;
  source: string;
  relevanceScore: number;
  tokensSaved: number;
}

export interface CompressionStats {
  totalChunks: number;
  compressedChunks: number;
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
}

type LlmCallFn = (prompt: string) => Promise<string>;

export class ContextualCompressor {
  private llmFn: LlmCallFn | null;
  private maxChunkTokens: number;

  constructor(llmFn?: LlmCallFn, maxChunkTokens = 500) {
    this.llmFn = llmFn ?? null;
    this.maxChunkTokens = maxChunkTokens;
  }

  /**
   * Compress chunks to only the parts relevant to the query.
   * Falls back to full chunks if LLM is unavailable.
   */
  async compress(
    query: string,
    chunks: Array<{ content: string; source: string }>
  ): Promise<CompressedChunk[]> {
    if (!this.llmFn || chunks.length === 0) {
      return this.fallbackFullChunks(chunks);
    }

    const results: CompressedChunk[] = [];

    for (const chunk of chunks) {
      try {
        const compressed = await this.compressChunk(query, chunk.content);
        const originalTokens = this.estimateTokens(chunk.content);
        const compressedTokens = this.estimateTokens(compressed);

        results.push({
          original: chunk.content,
          compressed,
          source: chunk.source,
          relevanceScore: compressedTokens > 0 ? Math.min(compressedTokens / originalTokens, 1.0) : 0,
          tokensSaved: Math.max(0, originalTokens - compressedTokens),
        });
      } catch {
        // Fallback to full chunk on error
        results.push({
          original: chunk.content,
          compressed: chunk.content,
          source: chunk.source,
          relevanceScore: 1.0,
          tokensSaved: 0,
        });
      }
    }

    return results;
  }

  /**
   * Get compression statistics from a set of results.
   */
  getStats(results: CompressedChunk[]): CompressionStats {
    const originalTokens = results.reduce(
      (sum, r) => sum + this.estimateTokens(r.original),
      0
    );
    const compressedTokens = results.reduce(
      (sum, r) => sum + this.estimateTokens(r.compressed),
      0
    );

    return {
      totalChunks: results.length,
      compressedChunks: results.filter((r) => r.tokensSaved > 0).length,
      originalTokens,
      compressedTokens,
      compressionRatio:
        originalTokens > 0 ? compressedTokens / originalTokens : 1,
    };
  }

  /**
   * Compress a single chunk using the LLM.
   */
  private async compressChunk(query: string, content: string): Promise<string> {
    if (!this.llmFn) return content;

    // If the chunk is already small, return as-is
    if (this.estimateTokens(content) <= this.maxChunkTokens) {
      return content;
    }

    const prompt = [
      "Extract only the sentences from the following document chunk that are relevant to answering the query.",
      "Return ONLY the relevant sentences, preserving their original wording.",
      "If nothing is relevant, return an empty string.",
      "",
      `Query: ${query}`,
      "",
      `Document chunk:`,
      content,
      "",
      "Relevant sentences:",
    ].join("\n");

    const result = await this.llmFn(prompt);
    return result.trim();
  }

  /**
   * Fallback: return chunks as-is when LLM is unavailable.
   */
  private fallbackFullChunks(
    chunks: Array<{ content: string; source: string }>
  ): CompressedChunk[] {
    return chunks.map((chunk) => ({
      original: chunk.content,
      compressed: chunk.content,
      source: chunk.source,
      relevanceScore: 1.0,
      tokensSaved: 0,
    }));
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
