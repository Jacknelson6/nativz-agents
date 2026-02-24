import type { SkillDefinition } from "./registry.js";

export type ToolGroup =
  | "social-media"
  | "analytics"
  | "content-creation"
  | "browser"
  | "file-system"
  | "memory"
  | "search"
  | "database"
  | "communication"
  | "general";

const GROUP_KEYWORDS: Record<ToolGroup, string[]> = {
  "social-media": ["twitter", "instagram", "linkedin", "facebook", "tiktok", "post", "social", "tweet", "share"],
  analytics: ["analytics", "metrics", "data", "chart", "graph", "report", "dashboard", "stats", "tracking"],
  "content-creation": ["write", "draft", "create", "generate", "content", "blog", "article", "copy", "edit"],
  browser: ["browse", "navigate", "click", "web", "page", "screenshot", "stagehand", "playwright", "crawl", "scrape"],
  "file-system": ["file", "read", "write", "directory", "folder", "path", "filesystem", "save", "open"],
  memory: ["memory", "remember", "recall", "store", "forget", "knowledge"],
  search: ["search", "find", "query", "lookup", "google", "brave"],
  database: ["database", "sql", "sqlite", "postgres", "query", "table", "insert", "select"],
  communication: ["email", "slack", "message", "send", "notify", "calendar", "meeting"],
  general: [],
};

const DEFAULT_MAX_TOOLS = 20;

export class ToolSelector {
  private usageHistory: Map<string, number[]> = new Map();

  selectTools(
    message: string,
    availableTools: SkillDefinition[],
    maxTools: number = DEFAULT_MAX_TOOLS
  ): SkillDefinition[] {
    if (availableTools.length <= maxTools) return availableTools;

    const scored = availableTools.map((tool) => ({
      tool,
      score: this.scoreRelevance(message, tool),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxTools).map((s) => s.tool);
  }

  scoreRelevance(message: string, tool: SkillDefinition): number {
    const msgLower = message.toLowerCase();
    const words = msgLower.split(/\s+/);
    let score = 0;

    // Name match (high weight)
    const nameParts = tool.name.toLowerCase().split(/[._-]/);
    for (const part of nameParts) {
      if (part.length < 2) continue;
      if (msgLower.includes(part)) score += 10;
    }

    // Description keyword match
    const descWords = (tool.description ?? "").toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length < 3) continue;
      if (descWords.includes(word)) score += 2;
    }

    // Group match
    const group = this.getToolGroup(tool);
    if (group !== "general") {
      const groupKw = GROUP_KEYWORDS[group];
      for (const kw of groupKw) {
        if (msgLower.includes(kw)) {
          score += 5;
          break;
        }
      }
    }

    // Recency boost
    const recent = this.usageHistory.get(tool.name);
    if (recent && recent.length > 0) {
      const lastUsed = recent[recent.length - 1];
      const minutesAgo = (Date.now() - lastUsed) / 60000;
      if (minutesAgo < 5) score += 8;
      else if (minutesAgo < 30) score += 4;
      else if (minutesAgo < 120) score += 2;
    }

    // Frequency boost
    if (recent && recent.length > 2) {
      score += Math.min(recent.length, 5);
    }

    return score;
  }

  getToolGroup(tool: SkillDefinition): ToolGroup {
    // Check explicit group field
    const explicit = (tool as SkillDefinition & { group?: string }).group;
    if (explicit && explicit in GROUP_KEYWORDS) return explicit as ToolGroup;

    const text = `${tool.name} ${tool.description}`.toLowerCase();

    let bestGroup: ToolGroup = "general";
    let bestCount = 0;

    for (const [group, keywords] of Object.entries(GROUP_KEYWORDS) as Array<[ToolGroup, string[]]>) {
      if (group === "general") continue;
      let count = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) count++;
      }
      if (count > bestCount) {
        bestCount = count;
        bestGroup = group;
      }
    }

    return bestGroup;
  }

  recordUsage(toolName: string): void {
    const history = this.usageHistory.get(toolName) ?? [];
    history.push(Date.now());
    // Keep last 50 entries
    if (history.length > 50) history.splice(0, history.length - 50);
    this.usageHistory.set(toolName, history);
  }

  getRecentlyUsed(withinMs: number = 300000): string[] {
    const cutoff = Date.now() - withinMs;
    const recent: Array<{ name: string; lastUsed: number }> = [];

    for (const [name, timestamps] of this.usageHistory) {
      const last = timestamps[timestamps.length - 1];
      if (last >= cutoff) {
        recent.push({ name, lastUsed: last });
      }
    }

    recent.sort((a, b) => b.lastUsed - a.lastUsed);
    return recent.map((r) => r.name);
  }
}
