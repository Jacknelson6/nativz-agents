/**
 * Prompt template system — Handlebars-style variable interpolation
 * with pre-built and custom templates, SQLite-backed storage.
 */

import Database from "better-sqlite3";
import * as path from "node:path";
import * as fs from "node:fs";
import { randomUUID } from "node:crypto";

// ── Types ──────────────────────────────────────────────────────────────────

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  agentId: string | null;
  content: string;
  variables: TemplateVariable[];
  isBuiltin: boolean;
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  defaultValue?: string;
  required: boolean;
}

export type TemplateCategory =
  | "seo"
  | "content"
  | "reporting"
  | "strategy"
  | "custom";

interface TemplateRow {
  id: string;
  name: string;
  description: string;
  category: string;
  agent_id: string | null;
  content: string;
  variables_json: string;
  is_builtin: number;
  is_favorite: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// ── Built-in Templates ─────────────────────────────────────────────────────

const BUILTIN_TEMPLATES: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt" | "usageCount" | "isFavorite">[] = [
  {
    name: "SEO Audit Report",
    description: "Comprehensive SEO audit for a client website",
    category: "seo",
    agentId: "seo",
    isBuiltin: true,
    content: `Perform a comprehensive SEO audit for {{client_name}}'s website at {{website_url}}.

Focus areas:
- Technical SEO (site speed, mobile-friendliness, crawlability)
- On-page SEO (title tags, meta descriptions, headings, content quality)
- Off-page SEO (backlink profile, domain authority)
- Content gaps and opportunities
- Competitor comparison with {{competitor_1}} and {{competitor_2}}

Generate the report in {{format}} format for the {{date}} reporting period.`,
    variables: [
      { name: "client_name", description: "Client business name", required: true },
      { name: "website_url", description: "Website URL to audit", required: true },
      { name: "competitor_1", description: "Primary competitor", required: false, defaultValue: "" },
      { name: "competitor_2", description: "Secondary competitor", required: false, defaultValue: "" },
      { name: "format", description: "Report format", required: false, defaultValue: "detailed" },
      { name: "date", description: "Reporting period", required: false, defaultValue: "current month" },
    ],
  },
  {
    name: "Keyword Research Brief",
    description: "Structured keyword research for a target topic",
    category: "seo",
    agentId: "seo",
    isBuiltin: true,
    content: `Perform keyword research for {{client_name}} targeting the topic: {{topic}}.

Target audience: {{audience}}
Geographic focus: {{geo}}

Deliver:
- Primary keyword recommendation with search volume estimate
- 10-15 secondary/long-tail keywords
- Keyword difficulty assessment
- Content format recommendations per keyword cluster
- SERP feature opportunities (featured snippets, People Also Ask)`,
    variables: [
      { name: "client_name", description: "Client name", required: true },
      { name: "topic", description: "Target topic or seed keyword", required: true },
      { name: "audience", description: "Target audience", required: false, defaultValue: "general" },
      { name: "geo", description: "Geographic focus", required: false, defaultValue: "US" },
    ],
  },
];

// ── TemplateEngine ─────────────────────────────────────────────────────────

export class TemplateEngine {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath ?? path.join(process.cwd(), "data", "templates.db");
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    this.db = new Database(resolvedPath);
    this.db.pragma("journal_mode = WAL");
    this.init();
    this.seedBuiltins();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT 'custom',
        agent_id TEXT,
        content TEXT NOT NULL,
        variables_json TEXT NOT NULL DEFAULT '[]',
        is_builtin INTEGER NOT NULL DEFAULT 0,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        usage_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
      CREATE INDEX IF NOT EXISTS idx_templates_agent ON templates(agent_id);
    `);
  }

  private seedBuiltins(): void {
    const existing = this.db.prepare("SELECT COUNT(*) as cnt FROM templates WHERE is_builtin = 1").get() as { cnt: number };
    if (existing.cnt >= BUILTIN_TEMPLATES.length) return;

    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO templates (id, name, description, category, agent_id, content, variables_json, is_builtin, is_favorite, usage_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0, ?, ?)
    `);

    const now = new Date().toISOString();
    const tx = this.db.transaction(() => {
      for (const t of BUILTIN_TEMPLATES) {
        insert.run(
          `builtin-${t.name.toLowerCase().replace(/\s+/g, "-")}`,
          t.name, t.description, t.category, t.agentId,
          t.content, JSON.stringify(t.variables),
          now, now,
        );
      }
    });
    tx();
  }

  // ── CRUD ───────────────────────────────────────────────────────────────

  create(template: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt" | "usageCount" | "isBuiltin">): PromptTemplate {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO templates (id, name, description, category, agent_id, content, variables_json, is_builtin, is_favorite, usage_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?)
    `).run(
      id, template.name, template.description, template.category,
      template.agentId, template.content, JSON.stringify(template.variables),
      template.isFavorite ? 1 : 0, now, now,
    );

    return { ...template, id, isBuiltin: false, usageCount: 0, createdAt: now, updatedAt: now };
  }

  get(id: string): PromptTemplate | null {
    const row = this.db.prepare("SELECT * FROM templates WHERE id = ?").get(id) as TemplateRow | undefined;
    return row ? this.rowToTemplate(row) : null;
  }

  list(options: { category?: TemplateCategory; agentId?: string; favoritesOnly?: boolean } = {}): PromptTemplate[] {
    let sql = "SELECT * FROM templates WHERE 1=1";
    const params: unknown[] = [];

    if (options.category) {
      sql += " AND category = ?";
      params.push(options.category);
    }
    if (options.agentId) {
      sql += " AND agent_id = ?";
      params.push(options.agentId);
    }
    if (options.favoritesOnly) {
      sql += " AND is_favorite = 1";
    }

    sql += " ORDER BY is_builtin DESC, usage_count DESC, name ASC";
    const rows = this.db.prepare(sql).all(...params) as TemplateRow[];
    return rows.map(this.rowToTemplate);
  }

  update(id: string, updates: Partial<Pick<PromptTemplate, "name" | "description" | "category" | "content" | "variables" | "isFavorite">>): PromptTemplate | null {
    const existing = this.get(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const merged = { ...existing, ...updates, updatedAt: now };

    this.db.prepare(`
      UPDATE templates SET name = ?, description = ?, category = ?, content = ?, variables_json = ?, is_favorite = ?, updated_at = ?
      WHERE id = ?
    `).run(
      merged.name, merged.description, merged.category,
      merged.content, JSON.stringify(merged.variables),
      merged.isFavorite ? 1 : 0, now, id,
    );

    return merged;
  }

  delete(id: string): boolean {
    const row = this.db.prepare("SELECT is_builtin FROM templates WHERE id = ?").get(id) as { is_builtin: number } | undefined;
    if (!row || row.is_builtin === 1) return false;
    return this.db.prepare("DELETE FROM templates WHERE id = ?").run(id).changes > 0;
  }

  toggleFavorite(id: string): boolean {
    const result = this.db.prepare("UPDATE templates SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END WHERE id = ?").run(id);
    return result.changes > 0;
  }

  // ── Rendering ──────────────────────────────────────────────────────────

  render(templateId: string, variables: Record<string, string>): string {
    const template = this.get(templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);

    // Increment usage count
    this.db.prepare("UPDATE templates SET usage_count = usage_count + 1 WHERE id = ?").run(templateId);

    return this.interpolate(template.content, variables);
  }

  renderString(templateString: string, variables: Record<string, string>): string {
    return this.interpolate(templateString, variables);
  }

  private interpolate(content: string, variables: Record<string, string>): string {
    let result = content;

    // Replace {{variable_name}} patterns
    result = result.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
      return variables[key] ?? "";
    });

    // Built-in variables
    const now = new Date();
    result = result.replace(/\{\{date\}\}/g, now.toISOString().split("T")[0]);
    result = result.replace(/\{\{time\}\}/g, now.toTimeString().split(" ")[0]);
    result = result.replace(/\{\{year\}\}/g, String(now.getFullYear()));
    result = result.replace(/\{\{month\}\}/g, now.toLocaleString("default", { month: "long" }));

    return result;
  }

  // ── Categories ─────────────────────────────────────────────────────────

  getCategories(): Array<{ category: TemplateCategory; count: number }> {
    const rows = this.db.prepare(
      "SELECT category, COUNT(*) as count FROM templates GROUP BY category ORDER BY count DESC"
    ).all() as Array<{ category: string; count: number }>;
    return rows.map((r) => ({ category: r.category as TemplateCategory, count: r.count }));
  }

  // ── Cleanup ────────────────────────────────────────────────────────────

  close(): void {
    this.db.close();
  }

  // ── Row Mapper ─────────────────────────────────────────────────────────

  private rowToTemplate(row: TemplateRow): PromptTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category as TemplateCategory,
      agentId: row.agent_id,
      content: row.content,
      variables: JSON.parse(row.variables_json) as TemplateVariable[],
      isBuiltin: row.is_builtin === 1,
      isFavorite: row.is_favorite === 1,
      usageCount: row.usage_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
