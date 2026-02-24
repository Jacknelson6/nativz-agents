/**
 * Task scheduling — cron-like recurring agent tasks stored in SQLite.
 */

import Database from "better-sqlite3";
import * as path from "node:path";
import * as fs from "node:fs";
import { randomUUID } from "node:crypto";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ScheduledTask {
  id: string;
  agentId: string;
  name: string;
  description: string;
  /** Simplified cron: "daily", "weekly:1" (Monday), "hourly", "monthly:15", or cron expression */
  schedule: string;
  /** The prompt/input to send to the agent */
  input: string;
  /** Chain id to execute (optional, if using chain instead of direct prompt) */
  chainId?: string;
  enabled: boolean;
  lastRunAt: string | null;
  lastRunStatus: "success" | "failed" | "pending" | null;
  lastRunResult: string | null;
  nextRunAt: string;
  createdAt: string;
}

export interface TaskRunResult {
  taskId: string;
  status: "success" | "failed";
  output: string;
  durationMs: number;
  completedAt: string;
}

interface ScheduledTaskRow {
  id: string;
  agent_id: string;
  name: string;
  description: string;
  schedule: string;
  input: string;
  chain_id: string | null;
  enabled: number;
  last_run_at: string | null;
  last_run_status: string | null;
  last_run_result: string | null;
  next_run_at: string;
  created_at: string;
}

type TaskExecutor = (agentId: string, input: string, chainId?: string) => Promise<{ success: boolean; output: string }>;

// ── Cron Parsing ───────────────────────────────────────────────────────────

function computeNextRun(schedule: string, from: Date = new Date()): Date {
  const next = new Date(from);

  if (schedule === "hourly") {
    next.setHours(next.getHours() + 1, 0, 0, 0);
    return next;
  }
  if (schedule === "daily") {
    next.setDate(next.getDate() + 1);
    next.setHours(9, 0, 0, 0); // 9 AM
    return next;
  }
  if (schedule.startsWith("weekly:")) {
    const day = parseInt(schedule.split(":")[1], 10); // 0=Sun, 1=Mon, ...
    const daysUntil = ((day - next.getDay() + 7) % 7) || 7;
    next.setDate(next.getDate() + daysUntil);
    next.setHours(9, 0, 0, 0);
    return next;
  }
  if (schedule.startsWith("monthly:")) {
    const dayOfMonth = parseInt(schedule.split(":")[1], 10);
    next.setMonth(next.getMonth() + 1, dayOfMonth);
    next.setHours(9, 0, 0, 0);
    return next;
  }

  // Fallback: daily
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  return next;
}

// ── Scheduler ──────────────────────────────────────────────────────────────

export class TaskScheduler {
  private db: Database.Database;
  private timer: ReturnType<typeof setInterval> | null = null;
  private executor: TaskExecutor | null = null;
  private onComplete: ((result: TaskRunResult) => void) | null = null;

  constructor(dataDir: string) {
    fs.mkdirSync(dataDir, { recursive: true });
    this.db = new Database(path.join(dataDir, "schedules.db"));
    this.db.pragma("journal_mode = WAL");
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scheduled_tasks (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        schedule TEXT NOT NULL,
        input TEXT NOT NULL,
        chain_id TEXT,
        enabled INTEGER DEFAULT 1,
        last_run_at TEXT,
        last_run_status TEXT,
        last_run_result TEXT,
        next_run_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
  }

  private rowToTask(row: ScheduledTaskRow): ScheduledTask {
    return {
      id: row.id,
      agentId: row.agent_id,
      name: row.name,
      description: row.description,
      schedule: row.schedule,
      input: row.input,
      chainId: row.chain_id ?? undefined,
      enabled: row.enabled === 1,
      lastRunAt: row.last_run_at,
      lastRunStatus: row.last_run_status as ScheduledTask["lastRunStatus"],
      lastRunResult: row.last_run_result,
      nextRunAt: row.next_run_at,
      createdAt: row.created_at,
    };
  }

  setExecutor(executor: TaskExecutor): void {
    this.executor = executor;
  }

  setOnComplete(cb: (result: TaskRunResult) => void): void {
    this.onComplete = cb;
  }

  createTask(params: {
    agentId: string;
    name: string;
    description?: string;
    schedule: string;
    input: string;
    chainId?: string;
  }): ScheduledTask {
    const id = randomUUID();
    const now = new Date();
    const nextRun = computeNextRun(params.schedule, now);

    this.db
      .prepare(
        `INSERT INTO scheduled_tasks (id, agent_id, name, description, schedule, input, chain_id, enabled, next_run_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      )
      .run(id, params.agentId, params.name, params.description ?? "", params.schedule, params.input, params.chainId ?? null, nextRun.toISOString(), now.toISOString());

    return this.getTask(id)!;
  }

  getTask(id: string): ScheduledTask | null {
    const row = this.db.prepare("SELECT * FROM scheduled_tasks WHERE id = ?").get(id) as ScheduledTaskRow | undefined;
    return row ? this.rowToTask(row) : null;
  }

  listTasks(agentId?: string): ScheduledTask[] {
    const rows = agentId
      ? (this.db.prepare("SELECT * FROM scheduled_tasks WHERE agent_id = ? ORDER BY next_run_at").all(agentId) as ScheduledTaskRow[])
      : (this.db.prepare("SELECT * FROM scheduled_tasks ORDER BY next_run_at").all() as ScheduledTaskRow[]);
    return rows.map((r) => this.rowToTask(r));
  }

  enableTask(id: string, enabled: boolean): void {
    this.db.prepare("UPDATE scheduled_tasks SET enabled = ? WHERE id = ?").run(enabled ? 1 : 0, id);
  }

  deleteTask(id: string): void {
    this.db.prepare("DELETE FROM scheduled_tasks WHERE id = ?").run(id);
  }

  /** Start the scheduler loop (checks every 60s). */
  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, 60_000);
    // Also tick immediately
    void this.tick();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Check for due tasks and execute them. */
  async tick(): Promise<void> {
    if (!this.executor) return;

    const now = new Date().toISOString();
    const dueTasks = this.db
      .prepare("SELECT * FROM scheduled_tasks WHERE enabled = 1 AND next_run_at <= ?")
      .all(now) as ScheduledTaskRow[];

    for (const row of dueTasks) {
      const task = this.rowToTask(row);
      const start = Date.now();

      try {
        const result = await this.executor(task.agentId, task.input, task.chainId);
        const durationMs = Date.now() - start;
        const status = result.success ? "success" : "failed";
        const nextRun = computeNextRun(task.schedule);

        this.db
          .prepare(
            "UPDATE scheduled_tasks SET last_run_at = ?, last_run_status = ?, last_run_result = ?, next_run_at = ? WHERE id = ?",
          )
          .run(new Date().toISOString(), status, result.output.slice(0, 10000), nextRun.toISOString(), task.id);

        const taskResult: TaskRunResult = {
          taskId: task.id,
          status,
          output: result.output,
          durationMs,
          completedAt: new Date().toISOString(),
        };
        this.onComplete?.(taskResult);
      } catch (err) {
        const nextRun = computeNextRun(task.schedule);
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.db
          .prepare(
            "UPDATE scheduled_tasks SET last_run_at = ?, last_run_status = 'failed', last_run_result = ?, next_run_at = ? WHERE id = ?",
          )
          .run(new Date().toISOString(), errorMsg, nextRun.toISOString(), task.id);
      }
    }
  }

  close(): void {
    this.stop();
    this.db.close();
  }
}
