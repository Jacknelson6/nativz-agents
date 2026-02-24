import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  sourceTitle: string;
  chunkIndex: number;
}

/**
 * Load markdown files from a directory, chunk them with overlap,
 * and prepend contextual retrieval info (source title/summary).
 */
export async function loadKnowledgeDirectory(
  dirPath: string,
  chunkSize = 1000,
  overlap = 200
): Promise<KnowledgeChunk[]> {
  const chunks: KnowledgeChunk[] = [];
  let entries: string[];
  try {
    entries = await fs.readdir(dirPath);
  } catch {
    return chunks;
  }

  for (const entry of entries) {
    const filePath = path.join(dirPath, entry);
    const stat = await fs.stat(filePath);
    if (!stat.isFile() || !entry.endsWith(".md")) continue;

    const content = await fs.readFile(filePath, "utf-8");
    const title = extractTitle(content, entry);
    const summary = content.slice(0, 200).replace(/\n/g, " ").trim();
    const fileChunks = chunkText(content, chunkSize, overlap);

    for (let i = 0; i < fileChunks.length; i++) {
      // Contextual retrieval: prepend source context
      const contextPrefix = `[Source: ${title}] [Summary: ${summary}]\n\n`;
      chunks.push({
        id: `${entry}:${i}`,
        content: contextPrefix + fileChunks[i],
        source: filePath,
        sourceTitle: title,
        chunkIndex: i,
      });
    }
  }

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
