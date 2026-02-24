/**
 * LanceDB vector store with SQLite FTS5 for hybrid search.
 * Uses LanceDB for vector storage/search and SQLite FTS5 for BM25 keyword search.
 */

import { connect, type Connection, type Table } from "@lancedb/lancedb";
import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";

export interface VectorChunk {
  id: string;
  content: string;
  source: string;
  sourceTitle: string;
  chunkIndex: number;
  embedding: number[];
}

export interface SearchResult {
  id: string;
  content: string;
  source: string;
  sourceTitle: string;
  chunkIndex: number;
  score: number;
}

interface LanceRecord {
  id: string;
  content: string;
  source: string;
  sourceTitle: string;
  chunkIndex: number;
  vector: number[];
  [key: string]: unknown;
}

export class VectorStore {
  private lanceConn: Connection | null = null;
  private lanceTable: Table | null = null;
  private ftsDb: Database.Database;
  private dbDir: string;
  private tableName: string;

  private constructor(ftsDb: Database.Database, dbDir: string, tableName: string) {
    this.ftsDb = ftsDb;
    this.dbDir = dbDir;
    this.tableName = tableName;
  }

  static async create(dataDir: string, agentId = "default"): Promise<VectorStore> {
    const dbDir = path.join(dataDir, "knowledge");
    fs.mkdirSync(dbDir, { recursive: true });

    const tableName = `chunks_${agentId.replace(/[^a-z0-9_]/gi, "_")}`;

    // SQLite FTS5 for BM25
    const ftsDb = new Database(path.join(dbDir, `${agentId}_fts.db`));
    ftsDb.pragma("journal_mode = WAL");
    ftsDb.exec(`
      CREATE TABLE IF NOT EXISTS chunks (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        source TEXT NOT NULL,
        source_title TEXT NOT NULL,
        chunk_index INTEGER NOT NULL
      )
    `);
    ftsDb.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
        id UNINDEXED,
        content,
        source_title,
        content=chunks,
        content_rowid=rowid
      )
    `);
    // Triggers for FTS sync
    ftsDb.exec(`
      CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
        INSERT INTO chunks_fts(rowid, id, content, source_title) VALUES (new.rowid, new.id, new.content, new.source_title);
      END
    `);
    ftsDb.exec(`
      CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
        INSERT INTO chunks_fts(chunks_fts, rowid, id, content, source_title) VALUES ('delete', old.rowid, old.id, old.content, old.source_title);
      END
    `);

    const store = new VectorStore(ftsDb, dbDir, tableName);

    // LanceDB
    store.lanceConn = await connect(path.join(dbDir, "lance"));

    // Check if table exists
    const tables = await store.lanceConn.tableNames();
    if (tables.includes(tableName)) {
      store.lanceTable = await store.lanceConn.openTable(tableName);
    }

    return store;
  }

  async insert(chunks: VectorChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    // Insert into FTS/SQLite
    const insertStmt = this.ftsDb.prepare(`
      INSERT OR REPLACE INTO chunks (id, content, source, source_title, chunk_index)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertMany = this.ftsDb.transaction((items: VectorChunk[]) => {
      for (const c of items) {
        insertStmt.run(c.id, c.content, c.source, c.sourceTitle, c.chunkIndex);
      }
    });
    insertMany(chunks);

    // Insert into LanceDB
    const records: LanceRecord[] = chunks.map((c) => ({
      id: c.id,
      content: c.content,
      source: c.source,
      sourceTitle: c.sourceTitle,
      chunkIndex: c.chunkIndex,
      vector: c.embedding,
    }));

    if (!this.lanceTable) {
      this.lanceTable = await this.lanceConn!.createTable(this.tableName, records);
    } else {
      await this.lanceTable.add(records);
    }
  }

  async vectorSearch(queryEmbedding: number[], topK = 10): Promise<SearchResult[]> {
    if (!this.lanceTable) return [];

    const results = await this.lanceTable
      .vectorSearch(queryEmbedding)
      .limit(topK)
      .toArray();

    return results.map((r) => ({
      id: r.id as string,
      content: r.content as string,
      source: r.source as string,
      sourceTitle: r.sourceTitle as string,
      chunkIndex: r.chunkIndex as number,
      score: 1 - ((r._distance as number) ?? 0), // LanceDB returns L2 distance
    }));
  }

  bm25Search(query: string, topK = 10): SearchResult[] {
    const stmt = this.ftsDb.prepare(`
      SELECT c.id, c.content, c.source, c.source_title, c.chunk_index,
             rank * -1 as score
      FROM chunks_fts f
      JOIN chunks c ON c.rowid = f.rowid
      WHERE chunks_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `);

    // Escape FTS5 special chars
    const escaped = query.replace(/['"*()]/g, " ").trim();
    if (!escaped) return [];

    try {
      const rows = stmt.all(escaped, topK) as Array<{
        id: string;
        content: string;
        source: string;
        source_title: string;
        chunk_index: number;
        score: number;
      }>;

      return rows.map((r) => ({
        id: r.id,
        content: r.content,
        source: r.source,
        sourceTitle: r.source_title,
        chunkIndex: r.chunk_index,
        score: r.score,
      }));
    } catch {
      return [];
    }
  }

  async hybridSearch(
    queryEmbedding: number[],
    queryText: string,
    topK = 10,
    alpha = 0.7
  ): Promise<SearchResult[]> {
    const [vectorResults, bm25Results] = await Promise.all([
      this.vectorSearch(queryEmbedding, topK * 2),
      Promise.resolve(this.bm25Search(queryText, topK * 2)),
    ]);

    // Normalize scores
    const normalizeScores = (results: SearchResult[]): Map<string, { result: SearchResult; normalized: number }> => {
      const map = new Map<string, { result: SearchResult; normalized: number }>();
      if (results.length === 0) return map;
      const maxScore = Math.max(...results.map((r) => r.score));
      const minScore = Math.min(...results.map((r) => r.score));
      const range = maxScore - minScore || 1;
      for (const r of results) {
        map.set(r.id, { result: r, normalized: (r.score - minScore) / range });
      }
      return map;
    };

    const vecMap = normalizeScores(vectorResults);
    const bm25Map = normalizeScores(bm25Results);

    // Combine
    const combined = new Map<string, { result: SearchResult; score: number }>();

    for (const [id, { result, normalized }] of vecMap) {
      const bm25Score = bm25Map.get(id)?.normalized ?? 0;
      combined.set(id, { result, score: alpha * normalized + (1 - alpha) * bm25Score });
    }
    for (const [id, { result, normalized }] of bm25Map) {
      if (!combined.has(id)) {
        combined.set(id, { result, score: (1 - alpha) * normalized });
      }
    }

    const sorted = [...combined.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return sorted.map(({ result, score }) => ({ ...result, score }));
  }

  async clear(): Promise<void> {
    this.ftsDb.exec("DELETE FROM chunks");
    if (this.lanceTable && this.lanceConn) {
      await this.lanceConn.dropTable(this.tableName);
      this.lanceTable = null;
    }
  }

  get size(): number {
    const row = this.ftsDb.prepare("SELECT COUNT(*) as cnt FROM chunks").get() as { cnt: number };
    return row.cnt;
  }

  close(): void {
    this.ftsDb.close();
  }
}
