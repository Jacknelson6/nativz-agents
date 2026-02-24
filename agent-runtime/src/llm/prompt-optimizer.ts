/**
 * DSPy-inspired Prompt Optimization — iteratively improves system prompts based on scored examples.
 */

import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";

export interface PromptExample {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  score: number; // 0.0 to 1.0
}

export interface OptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  modifications: string[];
  expectedImprovement: number;
}

interface PromptVariantRow {
  id: string;
  prompt_key: string;
  variant: string;
  prompt_text: string;
  total_score: number;
  usage_count: number;
  created_at: string;
}

type LLMCallFn = (prompt: string) => Promise<string>;

const OPTIMIZE_PROMPT = `You are a prompt engineering expert. Analyze these examples where a system prompt produced subpar results and suggest improvements.

Current system prompt:
{systemPrompt}

Low-scoring examples (score < 0.7):
{badExamples}

High-scoring examples (score >= 0.7) for reference:
{goodExamples}

Analyze what went wrong in low-scoring examples and produce an improved system prompt.

Return ONLY valid JSON:
{
  "optimizedPrompt": "the full improved system prompt",
  "modifications": ["list of specific changes made and why"],
  "expectedImprovement": 0.X
}
`;

export class PromptOptimizer {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolved = dbPath ?? path.join(process.cwd(), "data", "prompt_optimizer.db");
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    this.db = new Database(resolved);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS prompt_variants (
        id TEXT PRIMARY KEY,
        prompt_key TEXT NOT NULL,
        variant TEXT NOT NULL DEFAULT 'original',
        prompt_text TEXT NOT NULL,
        total_score REAL NOT NULL DEFAULT 0,
        usage_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_pv_key ON prompt_variants(prompt_key);
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS prompt_examples (
        id TEXT PRIMARY KEY,
        prompt_key TEXT NOT NULL,
        variant TEXT NOT NULL,
        input TEXT NOT NULL,
        expected_output TEXT NOT NULL,
        actual_output TEXT NOT NULL,
        score REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_pe_key ON prompt_examples(prompt_key, variant);
    `);
  }

  registerPrompt(key: string, promptText: string): void {
    const existing = this.db.prepare(
      "SELECT id FROM prompt_variants WHERE prompt_key = ? AND variant = 'original'"
    ).get(key) as { id: string } | undefined;

    if (!existing) {
      this.db.prepare(
        "INSERT INTO prompt_variants (id, prompt_key, variant, prompt_text) VALUES (?, ?, 'original', ?)"
      ).run(randomUUID(), key, promptText);
    }
  }

  recordExample(key: string, variant: string, example: PromptExample): void {
    this.db.prepare(
      "INSERT INTO prompt_examples (id, prompt_key, variant, input, expected_output, actual_output, score) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(randomUUID(), key, variant, example.input, example.expectedOutput, example.actualOutput, example.score);

    this.db.prepare(
      "UPDATE prompt_variants SET total_score = total_score + ?, usage_count = usage_count + 1 WHERE prompt_key = ? AND variant = ?"
    ).run(example.score, key, variant);
  }

  async optimize(
    systemPrompt: string,
    examples: PromptExample[],
    llmCall: LLMCallFn,
    promptKey?: string
  ): Promise<OptimizationResult> {
    const bad = examples
      .filter((e) => e.score < 0.7)
      .slice(0, 5)
      .map(
        (e, i) =>
          `Example ${i + 1} (score: ${e.score}):\n  Input: ${e.input}\n  Expected: ${e.expectedOutput}\n  Actual: ${e.actualOutput}`
      )
      .join("\n\n");

    const good = examples
      .filter((e) => e.score >= 0.7)
      .slice(0, 3)
      .map(
        (e, i) =>
          `Example ${i + 1} (score: ${e.score}):\n  Input: ${e.input}\n  Output: ${e.actualOutput}`
      )
      .join("\n\n");

    const prompt = OPTIMIZE_PROMPT
      .replace("{systemPrompt}", systemPrompt)
      .replace("{badExamples}", bad || "None")
      .replace("{goodExamples}", good || "None");

    const raw = await llmCall(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return {
        originalPrompt: systemPrompt,
        optimizedPrompt: systemPrompt,
        modifications: ["Optimization failed — no valid JSON returned"],
        expectedImprovement: 0,
      };
    }

    const parsed = JSON.parse(match[0]) as {
      optimizedPrompt: string;
      modifications: string[];
      expectedImprovement: number;
    };

    // Store the optimized variant
    const key = promptKey ?? "default";
    this.db.prepare(
      "INSERT INTO prompt_variants (id, prompt_key, variant, prompt_text) VALUES (?, ?, 'optimized', ?)"
    ).run(randomUUID(), key, parsed.optimizedPrompt);

    return {
      originalPrompt: systemPrompt,
      optimizedPrompt: parsed.optimizedPrompt,
      modifications: parsed.modifications,
      expectedImprovement: parsed.expectedImprovement,
    };
  }

  getVariantStats(key: string): Array<{ variant: string; avgScore: number; usageCount: number }> {
    const rows = this.db.prepare(
      "SELECT variant, total_score, usage_count FROM prompt_variants WHERE prompt_key = ?"
    ).all(key) as PromptVariantRow[];

    return rows.map((r) => ({
      variant: r.variant,
      avgScore: r.usage_count > 0 ? r.total_score / r.usage_count : 0,
      usageCount: r.usage_count,
    }));
  }

  getBestVariant(key: string): string | null {
    const row = this.db.prepare(
      "SELECT prompt_text FROM prompt_variants WHERE prompt_key = ? AND usage_count > 0 ORDER BY (total_score / usage_count) DESC LIMIT 1"
    ).get(key) as { prompt_text: string } | undefined;

    return row?.prompt_text ?? null;
  }

  close(): void {
    this.db.close();
  }
}
