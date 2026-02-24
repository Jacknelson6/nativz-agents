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
  | "ads"
  | "content"
  | "reporting"
  | "email"
  | "social"
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
    name: "Ad Performance Report",
    description: "Weekly/monthly ad performance analysis",
    category: "ads",
    agentId: "ads",
    isBuiltin: true,
    content: `Analyze the {{platform}} ad performance for {{client_name}} for the period {{start_date}} to {{end_date}}.

Key metrics to evaluate:
- ROAS (target: {{target_roas}})
- CPC and CPM trends
- Top performing ad creatives
- Audience segment performance
- Budget utilization ({{budget}} total)

Provide actionable recommendations for optimization.`,
    variables: [
      { name: "client_name", description: "Client name", required: true },
      { name: "platform", description: "Ad platform (Google Ads, Meta, TikTok, etc.)", required: true },
      { name: "start_date", description: "Report start date", required: true },
      { name: "end_date", description: "Report end date", required: true },
      { name: "target_roas", description: "Target ROAS", required: false, defaultValue: "4x" },
      { name: "budget", description: "Total budget", required: false, defaultValue: "N/A" },
    ],
  },
  {
    name: "Content Brief",
    description: "Structured content brief for writers",
    category: "content",
    agentId: "content-editor",
    isBuiltin: true,
    content: `Create a detailed content brief for the following:

Topic: {{topic}}
Target Keyword: {{primary_keyword}}
Secondary Keywords: {{secondary_keywords}}
Target Audience: {{audience}}
Content Type: {{content_type}}
Word Count Target: {{word_count}}

Include:
- Suggested headline options (5)
- Content outline with H2/H3 structure
- Key points to cover
- Internal linking opportunities
- CTA recommendations
- SEO guidelines (keyword density, meta description draft)`,
    variables: [
      { name: "topic", description: "Content topic", required: true },
      { name: "primary_keyword", description: "Main target keyword", required: true },
      { name: "secondary_keywords", description: "Supporting keywords", required: false, defaultValue: "" },
      { name: "audience", description: "Target audience", required: false, defaultValue: "general" },
      { name: "content_type", description: "Blog post, landing page, etc.", required: false, defaultValue: "blog post" },
      { name: "word_count", description: "Target word count", required: false, defaultValue: "1500" },
    ],
  },
  {
    name: "Social Media Calendar",
    description: "Weekly social media content calendar",
    category: "social",
    agentId: "content-editor",
    isBuiltin: true,
    content: `Create a {{duration}} social media content calendar for {{client_name}} on {{platforms}}.

Brand voice: {{brand_voice}}
Key themes: {{themes}}
Posting frequency: {{frequency}}

For each post include:
- Platform
- Date/time suggestion
- Copy (with hashtags)
- Visual direction
- CTA
- Content pillar it aligns to`,
    variables: [
      { name: "client_name", description: "Client/brand name", required: true },
      { name: "platforms", description: "Social platforms", required: true },
      { name: "duration", description: "Calendar duration", required: false, defaultValue: "1 week" },
      { name: "brand_voice", description: "Brand tone/voice", required: false, defaultValue: "professional yet approachable" },
      { name: "themes", description: "Key content themes", required: false, defaultValue: "" },
      { name: "frequency", description: "Posts per week per platform", required: false, defaultValue: "3-5" },
    ],
  },
  {
    name: "Client Email — Monthly Report",
    description: "Professional monthly performance email to client",
    category: "email",
    agentId: "account-manager",
    isBuiltin: true,
    content: `Draft a monthly performance email to {{contact_name}} at {{client_name}}.

Report period: {{month}}
Key wins: {{wins}}
Challenges: {{challenges}}
Next month priorities: {{priorities}}
Budget status: {{budget_status}}

Tone: Professional, confident, proactive. Close with next steps and a meeting CTA.`,
    variables: [
      { name: "contact_name", description: "Client contact name", required: true },
      { name: "client_name", description: "Client company name", required: true },
      { name: "month", description: "Reporting month", required: true },
      { name: "wins", description: "Key wins this month", required: false, defaultValue: "" },
      { name: "challenges", description: "Challenges faced", required: false, defaultValue: "" },
      { name: "priorities", description: "Next month priorities", required: false, defaultValue: "" },
      { name: "budget_status", description: "Budget utilization", required: false, defaultValue: "on track" },
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
