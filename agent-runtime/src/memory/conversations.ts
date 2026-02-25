import Database from "better-sqlite3";
import * as path from "node:path";
import * as fs from "node:fs";
import { randomUUID } from "node:crypto";

export interface ConversationMessage {
  role: string;
  content: string;
}

export interface Conversation {
  id: string;
  agentId: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ConversationRow {
  id: string;
  agent_id: string;
  title: string;
  messages_json: string;
  created_at: string;
  updated_at: string;
}

function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    agentId: row.agent_id,
    title: row.title,
    messages: JSON.parse(row.messages_json) as ConversationMessage[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ConversationStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath ?? path.join(process.cwd(), "data", "conversations.db");
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    this.db = new Database(resolvedPath);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        messages_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_conv_agent ON conversations(agent_id);
    `);
  }

  create(agentId: string, initialMessage?: string): Conversation {
    const id = randomUUID();
    const now = new Date().toISOString();
    const title = initialMessage ? initialMessage.slice(0, 50) : "New conversation";
    const messages: ConversationMessage[] = [];

    this.db.prepare(`
      INSERT INTO conversations (id, agent_id, title, messages_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, agentId, title, JSON.stringify(messages), now, now);

    return { id, agentId, title, messages, createdAt: now, updatedAt: now };
  }

  save(id: string, messages: ConversationMessage[]): void {
    const existing = this.db.prepare(`SELECT id FROM conversations WHERE id = ?`).get(id) as { id: string } | undefined;
    if (existing) {
      this.db.prepare(`
        UPDATE conversations SET messages_json = ?, updated_at = datetime('now') WHERE id = ?
      `).run(JSON.stringify(messages), id);
    }
  }

  updateTitle(id: string, title: string): void {
    this.db.prepare(`UPDATE conversations SET title = ?, updated_at = datetime('now') WHERE id = ?`).run(title, id);
  }

  load(id: string): Conversation | null {
    const row = this.db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(id) as ConversationRow | undefined;
    return row ? rowToConversation(row) : null;
  }

  list(agentId: string, options?: { limit?: number; offset?: number }): Conversation[] {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const rows = this.db.prepare(
      `SELECT * FROM conversations WHERE agent_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?`
    ).all(agentId, limit, offset) as ConversationRow[];
    return rows.map(rowToConversation);
  }

  search(agentId: string, query: string): Conversation[] {
    const rows = this.db.prepare(
      `SELECT * FROM conversations WHERE agent_id = ? AND (messages_json LIKE ? OR title LIKE ?) ORDER BY updated_at DESC LIMIT 20`
    ).all(agentId, `%${query}%`, `%${query}%`) as ConversationRow[];
    return rows.map(rowToConversation);
  }

  delete(id: string): void {
    this.db.prepare(`DELETE FROM conversations WHERE id = ?`).run(id);
  }

  close(): void {
    this.db.close();
  }
}
