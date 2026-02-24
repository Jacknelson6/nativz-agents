/**
 * Batch processing — run multiple items through an agent with concurrency control.
 * Supports CSV/JSON input, progress tracking, per-item success/failure.
 */

import type { AgentRuntime } from "./runtime.js";

// ── Types ──────────────────────────────────────────────────────────────────

export interface BatchItem {
  id: string;
  input: string;
  metadata?: Record<string, unknown>;
}

export interface BatchResult {
  id: string;
  input: string;
  output: string | null;
  success: boolean;
  error: string | null;
  durationMs: number;
  tokensUsed?: number;
}

export interface BatchProgress {
  total: number;
  completed: number;
  succeeded: number;
  failed: number;
  percentComplete: number;
  estimatedRemainingMs: number;
  currentItem: string | null;
}

export interface BatchConfig {
  agentId: string;
  concurrency: number;
  promptTemplate?: string;
  conversationId?: string;
  onProgress?: (progress: BatchProgress) => void;
  onItemComplete?: (result: BatchResult) => void;
  abortSignal?: AbortSignal;
}

export interface BatchSummary {
  totalItems: number;
  succeeded: number;
  failed: number;
  totalDurationMs: number;
  averageDurationMs: number;
  results: BatchResult[];
}

// ── CSV/JSON Parsing ───────────────────────────────────────────────────────

export function parseCSV(csv: string): BatchItem[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const items: BatchItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });

    items.push({
      id: row["id"] ?? `item-${i}`,
      input: row["input"] ?? row["text"] ?? row["content"] ?? values[0],
      metadata: row,
    });
  }

  return items;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export function parseJSON(json: string): BatchItem[] {
  const parsed = JSON.parse(json) as unknown;
  const arr = Array.isArray(parsed) ? parsed : [];

  return arr.map((item: unknown, idx: number) => {
    if (typeof item === "string") {
      return { id: `item-${idx + 1}`, input: item };
    }
    const obj = item as Record<string, unknown>;
    return {
      id: (obj["id"] as string) ?? `item-${idx + 1}`,
      input: (obj["input"] as string) ?? (obj["text"] as string) ?? (obj["content"] as string) ?? JSON.stringify(obj),
      metadata: obj,
    };
  });
}

// ── BatchProcessor ─────────────────────────────────────────────────────────

export class BatchProcessor {
  private runtime: AgentRuntime;

  constructor(runtime: AgentRuntime) {
    this.runtime = runtime;
  }

  async process(items: BatchItem[], config: BatchConfig): Promise<BatchSummary> {
    const startTime = Date.now();
    const results: BatchResult[] = [];
    let succeeded = 0;
    let failed = 0;
    let completedCount = 0;
    const durations: number[] = [];

    const progress: BatchProgress = {
      total: items.length,
      completed: 0,
      succeeded: 0,
      failed: 0,
      percentComplete: 0,
      estimatedRemainingMs: 0,
      currentItem: null,
    };

    const concurrency = Math.max(1, Math.min(config.concurrency, 10));
    const queue = [...items];
    const active: Promise<void>[] = [];

    const processItem = async (item: BatchItem): Promise<void> => {
      if (config.abortSignal?.aborted) return;

      progress.currentItem = item.id;
      const itemStart = Date.now();

      let prompt = item.input;
      if (config.promptTemplate) {
        prompt = config.promptTemplate.replace(/\{\{input\}\}/g, item.input);
        if (item.metadata) {
          for (const [key, val] of Object.entries(item.metadata)) {
            prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(val));
          }
        }
      }

      try {
        const response = await this.runtime.sendMessage(prompt, config.conversationId ?? `batch-${item.id}`);

        const duration = Date.now() - itemStart;
        const result: BatchResult = {
          id: item.id,
          input: item.input,
          output: response,
          success: true,
          error: null,
          durationMs: duration,
        };

        results.push(result);
        succeeded++;
        config.onItemComplete?.(result);
      } catch (err) {
        const duration = Date.now() - itemStart;
        const errorMsg = err instanceof Error ? err.message : String(err);
        const result: BatchResult = {
          id: item.id,
          input: item.input,
          output: null,
          success: false,
          error: errorMsg,
          durationMs: duration,
        };

        results.push(result);
        failed++;
        config.onItemComplete?.(result);
      }

      completedCount++;
      durations.push(Date.now() - itemStart);

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const remaining = items.length - completedCount;

      progress.completed = completedCount;
      progress.succeeded = succeeded;
      progress.failed = failed;
      progress.percentComplete = Math.round((completedCount / items.length) * 100);
      progress.estimatedRemainingMs = Math.round(avgDuration * remaining / concurrency);
      config.onProgress?.(progress);
    };

    // Process with concurrency control
    let idx = 0;
    while (idx < queue.length || active.length > 0) {
      while (active.length < concurrency && idx < queue.length) {
        if (config.abortSignal?.aborted) break;
        const item = queue[idx++];
        const promise = processItem(item).then(() => {
          active.splice(active.indexOf(promise), 1);
        });
        active.push(promise);
      }

      if (active.length > 0) {
        await Promise.race(active);
      }
    }

    const totalDuration = Date.now() - startTime;

    return {
      totalItems: items.length,
      succeeded,
      failed,
      totalDurationMs: totalDuration,
      averageDurationMs: items.length > 0 ? Math.round(totalDuration / items.length) : 0,
      results,
    };
  }

  async processFromCSV(csv: string, config: BatchConfig): Promise<BatchSummary> {
    const items = parseCSV(csv);
    return this.process(items, config);
  }

  async processFromJSON(json: string, config: BatchConfig): Promise<BatchSummary> {
    const items = parseJSON(json);
    return this.process(items, config);
  }
}
