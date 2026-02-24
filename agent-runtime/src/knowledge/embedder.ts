/**
 * Local embeddings using a simple approach.
 * TODO: Replace with @xenova/transformers (all-MiniLM-L6-v2) when native deps resolve.
 * Current fallback: TF-IDF-like bag-of-words embeddings for basic similarity.
 */

const VOCAB_SIZE = 512;

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
}

function hashToken(token: string): number {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = ((hash << 5) - hash + token.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % VOCAB_SIZE;
}

export function embed(text: string): number[] {
  const tokens = tokenize(text);
  const vec = new Float32Array(VOCAB_SIZE);
  for (const token of tokens) {
    vec[hashToken(token)] += 1;
  }
  // Normalize
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  const result: number[] = [];
  for (let i = 0; i < vec.length; i++) result.push(vec[i] / norm);
  return result;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}
