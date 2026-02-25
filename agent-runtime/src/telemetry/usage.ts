/**
 * Token usage tracking backed by SQLite.
 */

import Database from "better-sqlite3";

export interface UsageRecord {
  conversationId: string;
  agentId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd?: number;
}

export interface UsageSummary {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface UsageByGroup {
  group: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export class UsageTracker {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS token_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        cost_usd REAL NOT NULL DEFAULT 0,
        timestamp TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    // Migrate existing databases that lack the cost_usd column
    try {
      this.db.exec(`ALTER TABLE token_usage ADD COLUMN cost_usd REAL NOT NULL DEFAULT 0`);
    } catch {
      // Column already exists — ignore
    }
  }

  recordUsage(record: UsageRecord): void {
    this.db
      .prepare(
        `INSERT INTO token_usage (conversation_id, agent_id, provider, model, input_tokens, output_tokens, cost_usd)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        record.conversationId,
        record.agentId,
        record.provider,
        record.model,
        record.inputTokens,
        record.outputTokens,
        record.costUsd ?? 0
      );
  }

  getDailyUsage(date?: string): UsageSummary {
    const dateStr = date ?? new Date().toISOString().split("T")[0];
    const row = this.db
      .prepare(
        `SELECT COALESCE(SUM(input_tokens), 0) as input_tokens,
                COALESCE(SUM(output_tokens), 0) as output_tokens
         FROM token_usage WHERE date(timestamp) = ?`
      )
      .get(dateStr) as { input_tokens: number; output_tokens: number };

    return {
      inputTokens: row.input_tokens,
      outputTokens: row.output_tokens,
      totalTokens: row.input_tokens + row.output_tokens,
    };
  }

  getMonthlyUsage(yearMonth?: string): UsageSummary {
    const ym = yearMonth ?? new Date().toISOString().slice(0, 7);
    const row = this.db
      .prepare(
        `SELECT COALESCE(SUM(input_tokens), 0) as input_tokens,
                COALESCE(SUM(output_tokens), 0) as output_tokens
         FROM token_usage WHERE strftime('%Y-%m', timestamp) = ?`
      )
      .get(ym) as { input_tokens: number; output_tokens: number };

    return {
      inputTokens: row.input_tokens,
      outputTokens: row.output_tokens,
      totalTokens: row.input_tokens + row.output_tokens,
    };
  }

  getUsageByAgent(): UsageByGroup[] {
    const rows = this.db
      .prepare(
        `SELECT agent_id as grp,
                SUM(input_tokens) as input_tokens,
                SUM(output_tokens) as output_tokens
         FROM token_usage GROUP BY agent_id ORDER BY (input_tokens + output_tokens) DESC`
      )
      .all() as Array<{ grp: string; input_tokens: number; output_tokens: number }>;

    return rows.map((r) => ({
      group: r.grp,
      inputTokens: r.input_tokens,
      outputTokens: r.output_tokens,
      totalTokens: r.input_tokens + r.output_tokens,
    }));
  }

  getUsageByModel(): UsageByGroup[] {
    const rows = this.db
      .prepare(
        `SELECT model as grp,
                SUM(input_tokens) as input_tokens,
                SUM(output_tokens) as output_tokens
         FROM token_usage GROUP BY model ORDER BY (input_tokens + output_tokens) DESC`
      )
      .all() as Array<{ grp: string; input_tokens: number; output_tokens: number }>;

    return rows.map((r) => ({
      group: r.grp,
      inputTokens: r.input_tokens,
      outputTokens: r.output_tokens,
      totalTokens: r.input_tokens + r.output_tokens,
    }));
  }

  getDailyCost(date?: string): number {
    const dateStr = date ?? new Date().toISOString().split("T")[0];
    const row = this.db
      .prepare(
        `SELECT COALESCE(SUM(cost_usd), 0) as total_cost
         FROM token_usage WHERE date(timestamp) = ?`
      )
      .get(dateStr) as { total_cost: number };
    return row.total_cost;
  }

  getMonthlyCost(yearMonth?: string): number {
    const ym = yearMonth ?? new Date().toISOString().slice(0, 7);
    const row = this.db
      .prepare(
        `SELECT COALESCE(SUM(cost_usd), 0) as total_cost
         FROM token_usage WHERE strftime('%Y-%m', timestamp) = ?`
      )
      .get(ym) as { total_cost: number };
    return row.total_cost;
  }

  getConversationCount(): number {
    const row = this.db
      .prepare(`SELECT COUNT(DISTINCT conversation_id) as cnt FROM token_usage`)
      .get() as { cnt: number };
    return row.cnt;
  }

  close(): void {
    this.db.close();
  }
}
