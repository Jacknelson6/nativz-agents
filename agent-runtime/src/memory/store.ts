import Database from "better-sqlite3";
import * as path from "node:path";
import * as fs from "node:fs";

export interface Memory {
  id: number;
  agentId: string;
  userId: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export class MemoryStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath ?? path.join(process.cwd(), "data", "memory.db");
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    this.db = new Database(resolvedPath);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        user_id TEXT NOT NULL DEFAULT 'default',
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_memories_agent_user ON memories(agent_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_memories_key ON memories(agent_id, user_id, key);
    `);
  }

  remember(agentId: string, userId: string, key: string, value: string): void {
    const existing = this.db
      .prepare("SELECT id FROM memories WHERE agent_id = ? AND user_id = ? AND key = ?")
      .get(agentId, userId, key) as { id: number } | undefined;

    if (existing) {
      this.db
        .prepare("UPDATE memories SET value = ?, updated_at = datetime('now') WHERE id = ?")
        .run(value, existing.id);
    } else {
      this.db
        .prepare("INSERT INTO memories (agent_id, user_id, key, value) VALUES (?, ?, ?, ?)")
        .run(agentId, userId, key, value);
    }
  }

  recall(agentId: string, userId: string, query: string): Memory[] {
    const rows = this.db
      .prepare(
        `SELECT id, agent_id as agentId, user_id as userId, key, value, created_at as createdAt, updated_at as updatedAt
         FROM memories WHERE agent_id = ? AND user_id = ?
         AND (key LIKE ? OR value LIKE ?)
         ORDER BY updated_at DESC LIMIT 10`
      )
      .all(agentId, userId, `%${query}%`, `%${query}%`) as Memory[];
    return rows;
  }

  listMemories(agentId: string, userId: string): Memory[] {
    return this.db
      .prepare(
        `SELECT id, agent_id as agentId, user_id as userId, key, value, created_at as createdAt, updated_at as updatedAt
         FROM memories WHERE agent_id = ? AND user_id = ?
         ORDER BY updated_at DESC`
      )
      .all(agentId, userId) as Memory[];
  }

  close(): void {
    this.db.close();
  }
}
