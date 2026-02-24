import { embed, cosineSimilarity } from "./embedder.js";
import type { KnowledgeChunk } from "./loader.js";

/**
 * In-memory vector search using bag-of-words embeddings.
 * TODO: Replace with LanceDB for persistent, efficient vector search.
 */

interface IndexedChunk {
  chunk: KnowledgeChunk;
  embedding: number[];
}

export class KnowledgeSearch {
  private index: IndexedChunk[] = [];

  addChunks(chunks: KnowledgeChunk[]): void {
    for (const chunk of chunks) {
      this.index.push({
        chunk,
        embedding: embed(chunk.content),
      });
    }
  }

  search(query: string, topK = 5): Array<{ chunk: KnowledgeChunk; score: number }> {
    const queryEmbedding = embed(query);
    const scored = this.index.map((item) => ({
      chunk: item.chunk,
      score: cosineSimilarity(queryEmbedding, item.embedding),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  clear(): void {
    this.index = [];
  }

  get size(): number {
    return this.index.length;
  }
}
