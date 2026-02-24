/**
 * Webhook system — outgoing notifications & incoming triggers.
 * SQLite-backed registry with exponential backoff retry.
 */

import Database from "better-sqlite3";
import * as path from "node:path";
import * as fs from "node:fs";
import { randomUUID } from "node:crypto";

// ── Types ──────────────────────────────────────────────────────────────────

export type WebhookEventType =
  | "task_complete"
  | "report_generated"
  | "memory_updated"
  | "error"
  | "scheduled_task_done"
  | "conversation_started"
  | "agent_handoff";

export type WebhookDirection = "outgoing" | "incoming";

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  direction: WebhookDirection;
  events: WebhookEventType[];
  secret?: string;
  headers?: Record<string, string>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEventType;
  payload: string;
  statusCode: number | null;
  attempts: number;
  success: boolean;
  lastAttemptAt: string;
  nextRetryAt: string | null;
  error: string | null;
}

export interface IncomingWebhookPayload {
  event: string;
  agentId?: string;
  message?: string;
  data?: Record<string, unknown>;
  source?: string;
}

export interface WebhookEvent {
  type: WebhookEventType;
  agentId: string;
  conversationId?: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// ── Database Row Types ─────────────────────────────────────────────────────

interface WebhookRow {
  id: string;
  name: string;
  url: string;
  direction: string;
  events_json: string;
  secret: string | null;
  headers_json: string | null;
  enabled: number;
  created_at: string;
  updated_at: string;
}

interface DeliveryRow {
  id: string;
  webhook_id: string;
  event: string;
  payload: string;
  status_code: number | null;
  attempts: number;
  success: number;
  last_attempt_at: string;
  next_retry_at: string | null;
  error: string | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 60_000;

// ── WebhookManager ─────────────────────────────────────────────────────────

export class WebhookManager {
  private db: Database.Database;
  private retryTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private incomingHandlers: Map<string, (payload: IncomingWebhookPayload) => Promise<void>> = new Map();

  constructor(dbPath?: string) {
    const resolvedPath = dbPath ?? path.join(process.cwd(), "data", "webhooks.db");
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    this.db = new Database(resolvedPath);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        direction TEXT NOT NULL DEFAULT 'outgoing',
        events_json TEXT NOT NULL DEFAULT '[]',
        secret TEXT,
        headers_json TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id TEXT PRIMARY KEY,
        webhook_id TEXT NOT NULL,
        event TEXT NOT NULL,
        payload TEXT NOT NULL,
        status_code INTEGER,
        attempts INTEGER NOT NULL DEFAULT 0,
        success INTEGER NOT NULL DEFAULT 0,
        last_attempt_at TEXT NOT NULL,
        next_retry_at TEXT,
        error TEXT,
        FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_deliveries_webhook ON webhook_deliveries(webhook_id);
      CREATE INDEX IF NOT EXISTS idx_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE success = 0;
    `);
  }

  // ── Registration ───────────────────────────────────────────────────────

  register(config: Omit<WebhookConfig, "id" | "createdAt" | "updatedAt">): WebhookConfig {
    const id = randomUUID();
    const now = new Date().toISOString();
    const webhook: WebhookConfig = { ...config, id, createdAt: now, updatedAt: now };

    this.db.prepare(`
      INSERT INTO webhooks (id, name, url, direction, events_json, secret, headers_json, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, webhook.name, webhook.url, webhook.direction,
      JSON.stringify(webhook.events), webhook.secret ?? null,
      webhook.headers ? JSON.stringify(webhook.headers) : null,
      webhook.enabled ? 1 : 0, now, now,
    );

    return webhook;
  }

  unregister(webhookId: string): boolean {
    const result = this.db.prepare("DELETE FROM webhooks WHERE id = ?").run(webhookId);
    const timer = this.retryTimers.get(webhookId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(webhookId);
    }
    return result.changes > 0;
  }

  list(direction?: WebhookDirection): WebhookConfig[] {
    let rows: WebhookRow[];
    if (direction) {
      rows = this.db.prepare("SELECT * FROM webhooks WHERE direction = ? ORDER BY created_at DESC").all(direction) as WebhookRow[];
    } else {
      rows = this.db.prepare("SELECT * FROM webhooks ORDER BY created_at DESC").all() as WebhookRow[];
    }
    return rows.map(this.rowToConfig);
  }

  get(webhookId: string): WebhookConfig | null {
    const row = this.db.prepare("SELECT * FROM webhooks WHERE id = ?").get(webhookId) as WebhookRow | undefined;
    return row ? this.rowToConfig(row) : null;
  }

  update(webhookId: string, updates: Partial<Pick<WebhookConfig, "name" | "url" | "events" | "secret" | "headers" | "enabled">>): WebhookConfig | null {
    const existing = this.get(webhookId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const merged = { ...existing, ...updates, updatedAt: now };

    this.db.prepare(`
      UPDATE webhooks SET name = ?, url = ?, events_json = ?, secret = ?, headers_json = ?, enabled = ?, updated_at = ?
      WHERE id = ?
    `).run(
      merged.name, merged.url, JSON.stringify(merged.events),
      merged.secret ?? null, merged.headers ? JSON.stringify(merged.headers) : null,
      merged.enabled ? 1 : 0, now, webhookId,
    );

    return merged;
  }

  // ── Outgoing: Fire Events ──────────────────────────────────────────────

  async emit(event: WebhookEvent): Promise<void> {
    const webhooks = this.db.prepare(
      "SELECT * FROM webhooks WHERE direction = 'outgoing' AND enabled = 1"
    ).all() as WebhookRow[];

    const matching = webhooks
      .map(this.rowToConfig)
      .filter((w) => w.events.includes(event.type));

    await Promise.allSettled(matching.map((w) => this.deliver(w, event)));
  }

  private async deliver(webhook: WebhookConfig, event: WebhookEvent): Promise<void> {
    const deliveryId = randomUUID();
    const payload = JSON.stringify({
      id: deliveryId,
      event: event.type,
      agentId: event.agentId,
      conversationId: event.conversationId,
      data: event.data,
      timestamp: event.timestamp,
    });

    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO webhook_deliveries (id, webhook_id, event, payload, attempts, success, last_attempt_at)
      VALUES (?, ?, ?, ?, 0, 0, ?)
    `).run(deliveryId, webhook.id, event.type, payload, now);

    await this.attemptDelivery(deliveryId, webhook, payload, 0);
  }

  private async attemptDelivery(deliveryId: string, webhook: WebhookConfig, payload: string, attempt: number): Promise<void> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "NativzAgents/1.0",
      ...(webhook.headers ?? {}),
    };

    if (webhook.secret) {
      headers["X-Webhook-Secret"] = webhook.secret;
    }

    const now = new Date().toISOString();
    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: payload,
        signal: AbortSignal.timeout(10_000),
      });

      const success = response.ok;
      this.db.prepare(`
        UPDATE webhook_deliveries SET status_code = ?, attempts = ?, success = ?, last_attempt_at = ?, error = NULL, next_retry_at = NULL
        WHERE id = ?
      `).run(response.status, attempt + 1, success ? 1 : 0, now, deliveryId);

      if (!success && attempt < MAX_RETRIES) {
        this.scheduleRetry(deliveryId, webhook, payload, attempt + 1);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const nextAttempt = attempt + 1;

      if (nextAttempt <= MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
        const nextRetry = new Date(Date.now() + delay).toISOString();

        this.db.prepare(`
          UPDATE webhook_deliveries SET attempts = ?, last_attempt_at = ?, error = ?, next_retry_at = ?
          WHERE id = ?
        `).run(nextAttempt, now, errorMsg, nextRetry, deliveryId);

        this.scheduleRetry(deliveryId, webhook, payload, nextAttempt);
      } else {
        this.db.prepare(`
          UPDATE webhook_deliveries SET attempts = ?, last_attempt_at = ?, error = ?, next_retry_at = NULL
          WHERE id = ?
        `).run(nextAttempt, now, errorMsg, deliveryId);
      }
    }
  }

  private scheduleRetry(deliveryId: string, webhook: WebhookConfig, payload: string, attempt: number): void {
    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS);
    const timer = setTimeout(() => {
      this.retryTimers.delete(deliveryId);
      void this.attemptDelivery(deliveryId, webhook, payload, attempt);
    }, delay);
    this.retryTimers.set(deliveryId, timer);
  }

  // ── Incoming: Handle Triggers ──────────────────────────────────────────

  onIncoming(source: string, handler: (payload: IncomingWebhookPayload) => Promise<void>): void {
    this.incomingHandlers.set(source, handler);
  }

  async handleIncoming(webhookId: string, payload: IncomingWebhookPayload): Promise<{ accepted: boolean; message: string }> {
    const webhook = this.get(webhookId);
    if (!webhook) return { accepted: false, message: "Webhook not found" };
    if (!webhook.enabled) return { accepted: false, message: "Webhook disabled" };
    if (webhook.direction !== "incoming") return { accepted: false, message: "Not an incoming webhook" };

    const source = payload.source ?? "unknown";
    const handler = this.incomingHandlers.get(source) ?? this.incomingHandlers.get("default");

    if (!handler) {
      return { accepted: false, message: `No handler for source: ${source}` };
    }

    try {
      await handler(payload);
      return { accepted: true, message: "Processed" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { accepted: false, message: msg };
    }
  }

  // ── Delivery History ───────────────────────────────────────────────────

  getDeliveries(webhookId: string, limit = 50): WebhookDelivery[] {
    const rows = this.db.prepare(
      "SELECT * FROM webhook_deliveries WHERE webhook_id = ? ORDER BY last_attempt_at DESC LIMIT ?"
    ).all(webhookId, limit) as DeliveryRow[];
    return rows.map(this.rowToDelivery);
  }

  getRecentDeliveries(limit = 100): WebhookDelivery[] {
    const rows = this.db.prepare(
      "SELECT * FROM webhook_deliveries ORDER BY last_attempt_at DESC LIMIT ?"
    ).all(limit) as DeliveryRow[];
    return rows.map(this.rowToDelivery);
  }

  // ── Cleanup ────────────────────────────────────────────────────────────

  shutdown(): void {
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer);
    }
    this.retryTimers.clear();
    this.db.close();
  }

  // ── Row Mappers ────────────────────────────────────────────────────────

  private rowToConfig(row: WebhookRow): WebhookConfig {
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      direction: row.direction as WebhookDirection,
      events: JSON.parse(row.events_json) as WebhookEventType[],
      secret: row.secret ?? undefined,
      headers: row.headers_json ? (JSON.parse(row.headers_json) as Record<string, string>) : undefined,
      enabled: row.enabled === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private rowToDelivery(row: DeliveryRow): WebhookDelivery {
    return {
      id: row.id,
      webhookId: row.webhook_id,
      event: row.event as WebhookEventType,
      payload: row.payload,
      statusCode: row.status_code,
      attempts: row.attempts,
      success: row.success === 1,
      lastAttemptAt: row.last_attempt_at,
      nextRetryAt: row.next_retry_at,
      error: row.error,
    };
  }
}
