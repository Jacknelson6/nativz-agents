import Database from "better-sqlite3";
import * as path from "node:path";
import * as fs from "node:fs";
import { randomUUID } from "node:crypto";

export interface CheckpointState {
  conversationHistory: { role: string; content: string }[];
  toolCallResults: Record<string, string>;
  workingMemory: Record<string, string>;
  loopIteration: number;
}

export interface Checkpoint {
  id: string;
  conversationId: string;
  state: CheckpointState;
  createdAt: string;
}

interface CheckpointRow {
  id: string;
  conversation_id: string;
  state_json: string;
  created_at: string;
}

export class CheckpointManager {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath ?? path.join(process.cwd(), "data", "checkpoints.db");
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    this.db = new Database(resolvedPath);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS checkpoints (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        state_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_cp_conv ON checkpoints(conversation_id);
    `);
  }

  save(conversationId: string, state: CheckpointState): Checkpoint {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO checkpoints (id, conversation_id, state_json, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, conversationId, JSON.stringify(state), now);

    this.prune(conversationId);

    return { id, conversationId, state, createdAt: now };
  }

  restore(conversationId: string): Checkpoint | null {
    const row = this.db.prepare(
      `SELECT * FROM checkpoints WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1`
    ).get(conversationId) as CheckpointRow | undefined;

    if (!row) return null;

    return {
      id: row.id,
      conversationId: row.conversation_id,
      state: JSON.parse(row.state_json) as CheckpointState,
      createdAt: row.created_at,
    };
  }

  prune(conversationId: string, keepLast: number = 5): void {
    this.db.prepare(`
      DELETE FROM checkpoints WHERE conversation_id = ? AND id NOT IN (
        SELECT id FROM checkpoints WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?
      )
    `).run(conversationId, conversationId, keepLast);
  }

  close(): void {
    this.db.close();
  }
}
