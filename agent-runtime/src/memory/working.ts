import Database from "better-sqlite3";
import * as path from "node:path";
import * as fs from "node:fs";

interface WorkingMemoryRow {
  key: string;
  value: string;
  updated_at: string;
}

export class WorkingMemory {
  private db: Database.Database;
  private agentId: string;
  private conversationId: string;
  private maxTokens: number;

  constructor(agentId: string, conversationId: string, options?: { dbPath?: string; maxTokens?: number }) {
    this.agentId = agentId;
    this.conversationId = conversationId;
    this.maxTokens = options?.maxTokens ?? 4096;

    const resolvedPath = options?.dbPath ?? path.join(process.cwd(), "data", "working_memory.db");
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    this.db = new Database(resolvedPath);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS working_memory (
        agent_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (agent_id, conversation_id, key)
      );
    `);
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private currentSize(): number {
    const rows = this.listEntries();
    return rows.reduce((sum, r) => sum + this.estimateTokens(r.key) + this.estimateTokens(r.value), 0);
  }

  get(key: string): string | null {
    const row = this.db.prepare(
      `SELECT value FROM working_memory WHERE agent_id = ? AND conversation_id = ? AND key = ?`
    ).get(this.agentId, this.conversationId, key) as { value: string } | undefined;
    return row?.value ?? null;
  }

  set(key: string, value: string): boolean {
    const existingValue = this.get(key);
    const existingTokens = existingValue ? this.estimateTokens(key) + this.estimateTokens(existingValue) : 0;
    const newTokens = this.estimateTokens(key) + this.estimateTokens(value);
    const projectedSize = this.currentSize() - existingTokens + newTokens;

    if (projectedSize > this.maxTokens) {
      return false;
    }

    this.db.prepare(`
      INSERT INTO working_memory (agent_id, conversation_id, key, value, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(agent_id, conversation_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(this.agentId, this.conversationId, key, value);
    return true;
  }

  delete(key: string): boolean {
    const result = this.db.prepare(
      `DELETE FROM working_memory WHERE agent_id = ? AND conversation_id = ? AND key = ?`
    ).run(this.agentId, this.conversationId, key);
    return result.changes > 0;
  }

  private listEntries(): WorkingMemoryRow[] {
    return this.db.prepare(
      `SELECT key, value, updated_at FROM working_memory WHERE agent_id = ? AND conversation_id = ? ORDER BY updated_at ASC`
    ).all(this.agentId, this.conversationId) as WorkingMemoryRow[];
  }

  list(): Record<string, string> {
    const entries = this.listEntries();
    const result: Record<string, string> = {};
    for (const entry of entries) {
      result[entry.key] = entry.value;
    }
    return result;
  }

  clear(): void {
    this.db.prepare(
      `DELETE FROM working_memory WHERE agent_id = ? AND conversation_id = ?`
    ).run(this.agentId, this.conversationId);
  }

  serialize(): string {
    const entries = this.listEntries();
    if (entries.length === 0) return "<working_memory/>";

    const inner = entries
      .map((e) => `<entry key="${escapeXml(e.key)}">${escapeXml(e.value)}</entry>`)
      .join("");
    return `<working_memory>${inner}</working_memory>`;
  }

  close(): void {
    this.db.close();
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
