/**
 * Latency tracking backed by SQLite.
 */

import Database from "better-sqlite3";

export interface LatencyRecord {
  provider: string;
  model: string;
  timeToFirstTokenMs: number;
  totalTimeMs: number;
}

export interface LatencyStats {
  model: string;
  avgTimeToFirstTokenMs: number;
  avgTotalTimeMs: number;
  count: number;
}

export interface LatencyP95 {
  model: string;
  p95TimeToFirstTokenMs: number;
  p95TotalTimeMs: number;
}

export interface LatencyTrendPoint {
  date: string;
  avgTimeToFirstTokenMs: number;
  avgTotalTimeMs: number;
  count: number;
}

export class LatencyTracker {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS latency_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        time_to_first_token_ms REAL NOT NULL,
        total_time_ms REAL NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  record(rec: LatencyRecord): void {
    this.db
      .prepare(
        `INSERT INTO latency_logs (provider, model, time_to_first_token_ms, total_time_ms)
         VALUES (?, ?, ?, ?)`
      )
      .run(rec.provider, rec.model, rec.timeToFirstTokenMs, rec.totalTimeMs);
  }

  getAverageByModel(): LatencyStats[] {
    const rows = this.db
      .prepare(
        `SELECT model,
                AVG(time_to_first_token_ms) as avg_ttft,
                AVG(total_time_ms) as avg_total,
                COUNT(*) as cnt
         FROM latency_logs GROUP BY model`
      )
      .all() as Array<{ model: string; avg_ttft: number; avg_total: number; cnt: number }>;

    return rows.map((r) => ({
      model: r.model,
      avgTimeToFirstTokenMs: r.avg_ttft,
      avgTotalTimeMs: r.avg_total,
      count: r.cnt,
    }));
  }

  getP95ByModel(): LatencyP95[] {
    // Get distinct models first
    const models = this.db
      .prepare(`SELECT DISTINCT model FROM latency_logs`)
      .all() as Array<{ model: string }>;

    return models.map((m) => {
      const ttftRows = this.db
        .prepare(
          `SELECT time_to_first_token_ms as val FROM latency_logs
           WHERE model = ? ORDER BY time_to_first_token_ms`
        )
        .all(m.model) as Array<{ val: number }>;

      const totalRows = this.db
        .prepare(
          `SELECT total_time_ms as val FROM latency_logs
           WHERE model = ? ORDER BY total_time_ms`
        )
        .all(m.model) as Array<{ val: number }>;

      const p95Index = Math.floor(ttftRows.length * 0.95);

      return {
        model: m.model,
        p95TimeToFirstTokenMs: ttftRows[p95Index]?.val ?? 0,
        p95TotalTimeMs: totalRows[p95Index]?.val ?? 0,
      };
    });
  }

  getLatencyTrend(model: string, days = 30): LatencyTrendPoint[] {
    const rows = this.db
      .prepare(
        `SELECT date(timestamp) as dt,
                AVG(time_to_first_token_ms) as avg_ttft,
                AVG(total_time_ms) as avg_total,
                COUNT(*) as cnt
         FROM latency_logs
         WHERE model = ? AND timestamp >= datetime('now', ?)
         GROUP BY date(timestamp) ORDER BY dt`
      )
      .all(model, `-${days} days`) as Array<{
        dt: string;
        avg_ttft: number;
        avg_total: number;
        cnt: number;
      }>;

    return rows.map((r) => ({
      date: r.dt,
      avgTimeToFirstTokenMs: r.avg_ttft,
      avgTotalTimeMs: r.avg_total,
      count: r.cnt,
    }));
  }

  close(): void {
    this.db.close();
  }
}
