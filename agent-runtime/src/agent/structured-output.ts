/**
 * Structured Output Support — Parse, validate, and format LLM responses
 * into strongly-typed data structures using Zod schemas.
 */
import { z, type ZodSchema, type ZodObject, type ZodRawShape } from "zod";

// ─── Task-specific output schemas ────────────────────────────────────────────

export const SEOAuditReport = z.object({
  url: z.string(),
  overallScore: z.number().min(0).max(100),
  categories: z.array(
    z.object({
      name: z.string(),
      score: z.number().min(0).max(100),
      issues: z.array(
        z.object({
          severity: z.enum(["critical", "warning", "info"]),
          description: z.string(),
          recommendation: z.string(),
        })
      ),
    })
  ),
  topKeywords: z.array(z.object({ keyword: z.string(), volume: z.number(), difficulty: z.number() })),
  competitors: z.array(z.object({ domain: z.string(), overlapScore: z.number() })),
  summary: z.string(),
  generatedAt: z.string(),
});
export type SEOAuditReport = z.infer<typeof SEOAuditReport>;

export const ContentCalendar = z.object({
  clientName: z.string(),
  dateRange: z.object({ start: z.string(), end: z.string() }),
  entries: z.array(
    z.object({
      date: z.string(),
      platform: z.string(),
      contentType: z.enum(["post", "story", "reel", "blog", "newsletter", "tweet", "carousel"]),
      topic: z.string(),
      caption: z.string().optional(),
      hashtags: z.array(z.string()).optional(),
      status: z.enum(["draft", "scheduled", "published", "needs-review"]),
      notes: z.string().optional(),
    })
  ),
  themes: z.array(z.string()),
  summary: z.string(),
});
export type ContentCalendar = z.infer<typeof ContentCalendar>;

export const CampaignBrief = z.object({
  campaignName: z.string(),
  client: z.string(),
  objective: z.string(),
  targetAudience: z.object({
    demographics: z.string(),
    interests: z.array(z.string()),
    painPoints: z.array(z.string()),
  }),
  channels: z.array(z.string()),
  budget: z.object({ total: z.number(), breakdown: z.record(z.string(), z.number()) }),
  timeline: z.object({ start: z.string(), end: z.string(), milestones: z.array(z.object({ date: z.string(), description: z.string() })) }),
  kpis: z.array(z.object({ metric: z.string(), target: z.string() })),
  creativeDirection: z.string(),
  summary: z.string(),
});
export type CampaignBrief = z.infer<typeof CampaignBrief>;

export const ClientStatusReport = z.object({
  clientName: z.string(),
  reportPeriod: z.string(),
  overallHealth: z.enum(["excellent", "good", "needs-attention", "at-risk"]),
  sections: z.array(
    z.object({
      title: z.string(),
      status: z.enum(["on-track", "behind", "ahead", "blocked"]),
      highlights: z.array(z.string()),
      concerns: z.array(z.string()),
      metrics: z.array(z.object({ label: z.string(), value: z.string(), trend: z.enum(["up", "down", "flat"]) })),
    })
  ),
  actionItems: z.array(z.object({ task: z.string(), owner: z.string(), dueDate: z.string(), priority: z.enum(["high", "medium", "low"]) })),
  nextSteps: z.array(z.string()),
  summary: z.string(),
});
export type ClientStatusReport = z.infer<typeof ClientStatusReport>;

export const KeywordAnalysis = z.object({
  seedKeyword: z.string(),
  keywords: z.array(
    z.object({
      keyword: z.string(),
      searchVolume: z.number(),
      difficulty: z.number().min(0).max(100),
      cpc: z.number(),
      intent: z.enum(["informational", "navigational", "commercial", "transactional"]),
      opportunity: z.enum(["high", "medium", "low"]),
    })
  ),
  clusters: z.array(z.object({ theme: z.string(), keywords: z.array(z.string()), totalVolume: z.number() })),
  recommendations: z.array(z.string()),
  summary: z.string(),
});
export type KeywordAnalysis = z.infer<typeof KeywordAnalysis>;

// ─── Schema registry ─────────────────────────────────────────────────────────

const SCHEMA_MAP: Record<string, ZodSchema> = {
  seo_audit: SEOAuditReport,
  content_calendar: ContentCalendar,
  campaign_brief: CampaignBrief,
  client_status: ClientStatusReport,
  keyword_analysis: KeywordAnalysis,
};

export function getSchemaForTask(taskType: string): ZodSchema | undefined {
  return SCHEMA_MAP[taskType];
}

// ─── Parser ──────────────────────────────────────────────────────────────────

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  raw: string;
}

/**
 * Extract JSON from an LLM response that may contain markdown fences or prose.
 */
function extractJSON(text: string): string {
  // Try to find ```json ... ``` block first
  const fencedMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fencedMatch) return fencedMatch[1].trim();

  // Try to find raw JSON object
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];

  return text.trim();
}

export type LlmCallFn = (prompt: string) => Promise<string>;

export class StructuredOutputParser {
  private maxRetries: number;

  constructor(options?: { maxRetries?: number }) {
    this.maxRetries = options?.maxRetries ?? 2;
  }

  /**
   * Parse an LLM response string against a Zod schema.
   * Optionally retries with a correction prompt via the provided llmCall.
   */
  async parseResponse<T>(
    response: string,
    schema: ZodSchema<T>,
    llmCall?: LlmCallFn
  ): Promise<ParseResult<T>> {
    let lastError = "";
    let currentResponse = response;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const jsonStr = extractJSON(currentResponse);

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        lastError = `Invalid JSON: could not parse response`;
        if (attempt < this.maxRetries && llmCall) {
          currentResponse = await this.retryWithCorrection(currentResponse, lastError, llmCall);
          continue;
        }
        return { success: false, error: lastError, raw: currentResponse };
      }

      const result = schema.safeParse(parsed);
      if (result.success) {
        return { success: true, data: result.data, raw: currentResponse };
      }

      lastError = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");

      if (attempt < this.maxRetries && llmCall) {
        currentResponse = await this.retryWithCorrection(currentResponse, lastError, llmCall);
        continue;
      }

      return { success: false, error: lastError, raw: currentResponse };
    }

    return { success: false, error: lastError, raw: currentResponse };
  }

  private async retryWithCorrection(
    originalResponse: string,
    error: string,
    llmCall: LlmCallFn
  ): Promise<string> {
    const correctionPrompt = [
      "The previous response had validation errors. Please fix and return ONLY valid JSON.",
      "",
      "Errors:",
      error,
      "",
      "Original response:",
      originalResponse.slice(0, 2000),
      "",
      "Return ONLY the corrected JSON object, no explanation.",
    ].join("\n");

    return llmCall(correctionPrompt);
  }

  /**
   * Render structured data as beautiful markdown.
   */
  formatAsMarkdown<T extends Record<string, unknown>>(data: T, schemaName?: string): string {
    const lines: string[] = [];
    const title = schemaName
      ? schemaName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Report";

    lines.push(`# ${title}`, "");

    for (const [key, value] of Object.entries(data)) {
      const heading = key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        lines.push(`**${heading}:** ${String(value)}`, "");
      } else if (Array.isArray(value)) {
        lines.push(`## ${heading}`, "");
        if (value.length === 0) {
          lines.push("_None_", "");
        } else if (typeof value[0] === "object" && value[0] !== null) {
          // Render as table
          const keys = Object.keys(value[0] as Record<string, unknown>);
          const headerRow = `| ${keys.join(" | ")} |`;
          const separator = `| ${keys.map(() => "---").join(" | ")} |`;
          lines.push(headerRow, separator);
          for (const row of value) {
            const r = row as Record<string, unknown>;
            lines.push(`| ${keys.map((k) => String(r[k] ?? "")).join(" | ")} |`);
          }
          lines.push("");
        } else {
          for (const item of value) {
            lines.push(`- ${String(item)}`);
          }
          lines.push("");
        }
      } else if (typeof value === "object" && value !== null) {
        lines.push(`## ${heading}`, "");
        for (const [subKey, subVal] of Object.entries(value as Record<string, unknown>)) {
          const subHeading = subKey.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
          if (Array.isArray(subVal)) {
            lines.push(`**${subHeading}:**`);
            for (const item of subVal) {
              lines.push(`- ${typeof item === "object" ? JSON.stringify(item) : String(item)}`);
            }
          } else {
            lines.push(`**${subHeading}:** ${String(subVal)}`);
          }
        }
        lines.push("");
      }
    }

    return lines.join("\n");
  }

  /**
   * Format data as clean, indented JSON.
   */
  formatAsJSON<T>(data: T): string {
    return JSON.stringify(data, null, 2);
  }
}
