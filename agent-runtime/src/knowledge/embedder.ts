/**
 * Embeddings module with Ollama integration and TF-IDF fallback.
 */

const EMBEDDING_DIM = 768;
const OLLAMA_URL = "http://localhost:11434";
const OLLAMA_MODEL = "nomic-embed-text:v1.5";

export class OllamaEmbedder {
  private url: string;
  private model: string;
  private available: boolean | null = null;

  constructor(url = OLLAMA_URL, model = OLLAMA_MODEL) {
    this.url = url;
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    if (this.available !== null) return this.available;
    try {
      const res = await fetch(`${this.url}/api/tags`, { signal: AbortSignal.timeout(3000) });
      this.available = res.ok;
    } catch {
      this.available = false;
    }
    return this.available;
  }

  async embed(text: string): Promise<number[]> {
    const res = await fetch(`${this.url}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, input: text }),
    });
    if (!res.ok) throw new Error(`Ollama embed failed: ${res.status}`);
    const data = (await res.json()) as { embeddings: number[][] };
    return data.embeddings[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const res = await fetch(`${this.url}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    if (!res.ok) throw new Error(`Ollama embed batch failed: ${res.status}`);
    const data = (await res.json()) as { embeddings: number[][] };
    return data.embeddings;
  }
}

// --- TF-IDF Fallback ---

const FALLBACK_DIM = 512;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function hashToken(token: string, dim: number): number {
  let h = 5381;
  for (let i = 0; i < token.length; i++) {
    h = ((h << 5) + h + token.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % dim;
}

function hashSign(token: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h & 1 ? 1 : -1;
}

/** Feature-hashing with sign trick for better collision handling */
export function fallbackEmbed(text: string): number[] {
  const tokens = tokenize(text);
  const vec = new Float64Array(FALLBACK_DIM);

  // Count term frequencies
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) ?? 0) + 1);
  }

  for (const [token, count] of tf) {
    // Use multiple hash functions for better distribution
    const idx1 = hashToken(token, FALLBACK_DIM);
    const idx2 = hashToken(token + "_2", FALLBACK_DIM);
    const sign = hashSign(token);
    const logTf = 1 + Math.log(count);
    vec[idx1] += sign * logTf;
    vec[idx2] += -sign * logTf * 0.5;
  }

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  const result: number[] = new Array(FALLBACK_DIM);
  for (let i = 0; i < FALLBACK_DIM; i++) result[i] = vec[i] / norm;
  return result;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

/** Convenience: get an embedder that uses Ollama if available, else fallback */
export async function createEmbedder(): Promise<{
  embed: (text: string) => Promise<number[]>;
  embedBatch: (texts: string[]) => Promise<number[][]>;
  dimension: number;
  isOllama: boolean;
}> {
  const ollama = new OllamaEmbedder();
  if (await ollama.isAvailable()) {
    return {
      embed: (t) => ollama.embed(t),
      embedBatch: (t) => ollama.embedBatch(t),
      dimension: EMBEDDING_DIM,
      isOllama: true,
    };
  }
  return {
    embed: async (t) => fallbackEmbed(t),
    embedBatch: async (texts) => texts.map(fallbackEmbed),
    dimension: FALLBACK_DIM,
    isOllama: false,
  };
}
