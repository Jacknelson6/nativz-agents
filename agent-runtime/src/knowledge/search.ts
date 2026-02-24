/**
 * Hybrid Knowledge Search v2.
 * Combines LanceDB vector search with SQLite FTS5 BM25 scoring.
 */

import { createEmbedder } from "./embedder.js";
import { VectorStore, type SearchResult } from "./lancedb.js";
import type { KnowledgeChunk } from "./loader.js";

export type { SearchResult };

export class KnowledgeSearch {
  private store: VectorStore | null = null;
  private embedder: Awaited<ReturnType<typeof createEmbedder>> | null = null;
  private alpha: number;
  private initPromise: Promise<void> | null = null;
  private dataDir: string;
  private agentId: string;

  constructor(dataDir = "data", agentId = "default", alpha = 0.7) {
    this.alpha = alpha;
    this.dataDir = dataDir;
    this.agentId = agentId;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.store && this.embedder) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    this.initPromise = (async () => {
      this.store = await VectorStore.create(this.dataDir, this.agentId);
      this.embedder = await createEmbedder();
    })();
    await this.initPromise;
  }

  async addChunks(chunks: KnowledgeChunk[]): Promise<void> {
    if (chunks.length === 0) return;
    await this.ensureInitialized();

    const batchSize = 32;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map((c) => c.content);
      const embeddings = await this.embedder!.embedBatch(texts);

      const vectorChunks = batch.map((chunk, idx) => ({
        ...chunk,
        embedding: embeddings[idx],
      }));

      await this.store!.insert(vectorChunks);
    }
  }

  async search(query: string, topK = 5): Promise<SearchResult[]> {
    await this.ensureInitialized();
    const queryEmbedding = await this.embedder!.embed(query);
    return this.store!.hybridSearch(queryEmbedding, query, topK, this.alpha);
  }

  async vectorSearch(query: string, topK = 5): Promise<SearchResult[]> {
    await this.ensureInitialized();
    const queryEmbedding = await this.embedder!.embed(query);
    return this.store!.vectorSearch(queryEmbedding, topK);
  }

  bm25Search(query: string, topK = 5): SearchResult[] {
    if (!this.store) return [];
    return this.store.bm25Search(query, topK);
  }

  async clear(): Promise<void> {
    if (this.store) await this.store.clear();
  }

  get size(): number {
    return this.store?.size ?? 0;
  }

  close(): void {
    this.store?.close();
  }
}
