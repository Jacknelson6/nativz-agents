/**
 * Knowledge loader: loads markdown files, chunks with overlap,
 * adds contextual metadata, and supports content hashing for incremental indexing.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as crypto from "node:crypto";

export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  sourceTitle: string;
  chunkIndex: number;
}

export type ProgressCallback = (indexed: number, total: number) => void;

interface LoadOptions {
  chunkSize?: number;
  overlap?: number;
  hashCachePath?: string;
  onProgress?: ProgressCallback;
}

function contentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
}

async function loadHashCache(cachePath: string): Promise<Map<string, string>> {
  try {
    const raw = await fs.readFile(cachePath, "utf-8");
    const entries = JSON.parse(raw) as Array<[string, string]>;
    return new Map(entries);
  } catch {
    return new Map();
  }
}

async function saveHashCache(cachePath: string, cache: Map<string, string>): Promise<void> {
  await fs.writeFile(cachePath, JSON.stringify([...cache.entries()]), "utf-8");
}

/**
 * Load markdown files from a directory, chunk them with overlap,
 * and prepend contextual retrieval info.
 * Supports incremental indexing via content hashing.
 */
export async function loadKnowledgeDirectory(
  dirPath: string,
  options: LoadOptions = {}
): Promise<KnowledgeChunk[]> {
  const { chunkSize = 1000, overlap = 200, hashCachePath, onProgress } = options;
  const chunks: KnowledgeChunk[] = [];

  let entries: string[];
  try {
    entries = await fs.readdir(dirPath);
  } catch {
    return chunks;
  }

  const mdFiles = entries.filter((e) => e.endsWith(".md"));

  // Load hash cache for incremental indexing
  const cachePath = hashCachePath ?? path.join(dirPath, ".knowledge-hashes.json");
  const hashCache = await loadHashCache(cachePath);
  const newCache = new Map<string, string>();
  let indexed = 0;

  for (const entry of mdFiles) {
    const filePath = path.join(dirPath, entry);
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) continue;

    const content = await fs.readFile(filePath, "utf-8");
    const hash = contentHash(content);
    newCache.set(entry, hash);

    // Skip if unchanged
    if (hashCache.get(entry) === hash) {
      indexed++;
      onProgress?.(indexed, mdFiles.length);
      continue;
    }

    const title = extractTitle(content, entry);
    const fileChunks = chunkText(content, chunkSize, overlap);

    for (let i = 0; i < fileChunks.length; i++) {
      const contextPrefix = `Source: ${filePath}\n[${title}]\n\n`;
      chunks.push({
        id: `${entry}:${i}`,
        content: contextPrefix + fileChunks[i],
        source: filePath,
        sourceTitle: title,
        chunkIndex: i,
      });
    }

    indexed++;
    onProgress?.(indexed, mdFiles.length);
  }

  // Save updated cache
  await saveHashCache(cachePath, newCache);

  return chunks;
}

function extractTitle(content: string, filename: string): string {
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  return filename.replace(/\.md$/, "").replace(/[-_]/g, " ");
}

function chunkText(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += size - overlap;
  }
  return chunks;
}
