import Database from "better-sqlite3";
import * as path from "node:path";
import * as fs from "node:fs";
import { randomUUID } from "node:crypto";

export type EntityType = "client" | "brand" | "user" | "project";
export type MemoryCategory = "preference" | "decision" | "fact" | "relationship" | "task" | "feedback";

export interface StructuredMemory {
  id: string;
  agentId: string;
  entityId: string;
  entityType: EntityType;
  category: MemoryCategory;
  content: string;
  confidence: number;
  embedding: Float32Array | null;
  accessCount: number;
  lastAccessed: string;
  createdAt: string;
}

interface MemoryRow {
  id: string;
  agent_id: string;
  entity_id: string;
  entity_type: string;
  category: string;
  content: string;
  confidence: number;
  embedding: Buffer | null;
  access_count: number;
  last_accessed: string;
  created_at: string;
}

function rowToMemory(row: MemoryRow): StructuredMemory {
  return {
    id: row.id,
    agentId: row.agent_id,
    entityId: row.entity_id,
    entityType: row.entity_type as EntityType,
    category: row.category as MemoryCategory,
    content: row.content,
    confidence: row.confidence,
    embedding: row.embedding ? new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.byteLength / 4) : null,
    accessCount: row.access_count,
    lastAccessed: row.last_accessed,
    createdAt: row.created_at,
  };
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export class StructuredMemoryStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath ?? path.join(process.cwd(), "data", "structured_memory.db");
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    this.db = new Database(resolvedPath);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS structured_memories (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 0.5,
        embedding BLOB,
        access_count INTEGER NOT NULL DEFAULT 0,
        last_accessed TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_sm_agent ON structured_memories(agent_id);
      CREATE INDEX IF NOT EXISTS idx_sm_entity ON structured_memories(agent_id, entity_id, entity_type);
      CREATE INDEX IF NOT EXISTS idx_sm_category ON structured_memories(agent_id, category);
    `);
  }

  addMemory(memory: Omit<StructuredMemory, "id" | "accessCount" | "lastAccessed" | "createdAt">): StructuredMemory {
    const id = randomUUID();
    const now = new Date().toISOString();
    const embeddingBlob = memory.embedding ? Buffer.from(memory.embedding.buffer, memory.embedding.byteOffset, memory.embedding.byteLength) : null;

    this.db.prepare(`
      INSERT INTO structured_memories (id, agent_id, entity_id, entity_type, category, content, confidence, embedding, access_count, last_accessed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, memory.agentId, memory.entityId, memory.entityType, memory.category, memory.content, memory.confidence, embeddingBlob, now, now);

    return {
      id,
      agentId: memory.agentId,
      entityId: memory.entityId,
      entityType: memory.entityType,
      category: memory.category,
      content: memory.content,
      confidence: memory.confidence,
      embedding: memory.embedding,
      accessCount: 0,
      lastAccessed: now,
      createdAt: now,
    };
  }

  searchMemories(agentId: string, query: string, options?: { limit?: number; category?: MemoryCategory; queryEmbedding?: Float32Array }): StructuredMemory[] {
    const limit = options?.limit ?? 20;
    let sql = `SELECT * FROM structured_memories WHERE agent_id = ? AND (content LIKE ?)`;
    const params: (string | number)[] = [agentId, `%${query}%`];

    if (options?.category) {
      sql += ` AND category = ?`;
      params.push(options.category);
    }
    sql += ` ORDER BY last_accessed DESC LIMIT ?`;
    params.push(limit * 2); // fetch extra for re-ranking

    const rows = this.db.prepare(sql).all(...params) as MemoryRow[];
    const memories = rows.map(rowToMemory);
    const now = Date.now();

    const scored = memories.map((m) => {
      const ageMs = now - new Date(m.createdAt).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const recencyFactor = 1 / (1 + ageDays * 0.05);
      const accessFactor = Math.log2(m.accessCount + 2) / 10;

      let relevance = 1.0;
      if (options?.queryEmbedding && m.embedding) {
        relevance = Math.max(0, cosineSimilarity(options.queryEmbedding, m.embedding));
      }

      const score = relevance * recencyFactor * (1 + accessFactor) * m.confidence;
      return { memory: m, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.memory);
  }

  getMemoriesForEntity(agentId: string, entityId: string, entityType: EntityType): StructuredMemory[] {
    const rows = this.db.prepare(
      `SELECT * FROM structured_memories WHERE agent_id = ? AND entity_id = ? AND entity_type = ? ORDER BY last_accessed DESC`
    ).all(agentId, entityId, entityType) as MemoryRow[];
    return rows.map(rowToMemory);
  }


  getAllMemories(agentId: string, limit?: number): StructuredMemory[] {
    const rows = this.db.prepare(
      `SELECT * FROM structured_memories WHERE agent_id = ? ORDER BY last_accessed DESC LIMIT ?`
    ).all(agentId, limit ?? 200) as MemoryRow[];
    return rows.map(rowToMemory);
  }

  updateAccessCount(id: string): void {
    this.db.prepare(
      `UPDATE structured_memories SET access_count = access_count + 1, last_accessed = datetime('now') WHERE id = ?`
    ).run(id);
  }

  updateMemory(id: string, content: string, confidence?: number): void {
    if (confidence !== undefined) {
      this.db.prepare(
        `UPDATE structured_memories SET content = ?, confidence = ?, last_accessed = datetime('now') WHERE id = ?`
      ).run(content, confidence, id);
    } else {
      this.db.prepare(
        `UPDATE structured_memories SET content = ?, last_accessed = datetime('now') WHERE id = ?`
      ).run(content, id);
    }
  }

  deleteMemory(id: string): void {
    this.db.prepare(`DELETE FROM structured_memories WHERE id = ?`).run(id);
  }

  deduplicateMemories(agentId: string, entityId: string): number {
    // For same entity + category, if content is very similar and newer has higher confidence, remove older
    const rows = this.db.prepare(
      `SELECT * FROM structured_memories WHERE agent_id = ? AND entity_id = ? ORDER BY category, created_at DESC`
    ).all(agentId, entityId) as MemoryRow[];

    const toDelete: string[] = [];
    const seen = new Map<string, MemoryRow>();

    for (const row of rows) {
      const key = `${row.category}:${row.content.toLowerCase().trim().slice(0, 100)}`;
      const existing = seen.get(key);
      if (existing) {
        // Current row is older (sorted DESC), delete it if existing has >= confidence
        if (existing.confidence >= row.confidence) {
          toDelete.push(row.id);
        }
      } else {
        seen.set(key, row);
      }
    }

    if (toDelete.length > 0) {
      const placeholders = toDelete.map(() => "?").join(",");
      this.db.prepare(`DELETE FROM structured_memories WHERE id IN (${placeholders})`).run(...toDelete);
    }

    return toDelete.length;
  }

  close(): void {
    this.db.close();
  }
}
