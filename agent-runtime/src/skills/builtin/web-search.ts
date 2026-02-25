import { z } from "zod";
import type { SkillDefinition } from "../registry.js";

export const webSearchSkill: SkillDefinition = {
  name: "web-search",
  description: "Search the web using Brave Search API. Returns top results with titles, URLs, and descriptions.",
  parameters: z.object({
    query: z.string().describe("Search query"),
    count: z.number().optional().default(5).describe("Number of results (1-10)"),
  }),
  execute: async (params) => {
    const { query, count } = params as { query: string; count?: number };
    const apiKey = process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_API_KEY;
    if (!apiKey) {
      return JSON.stringify({ error: "Web search requires a Brave Search API key. Set BRAVE_SEARCH_API_KEY in your .env file. Get a free key at https://brave.com/search/api/" });
    }
    try {
      const url = new URL("https://api.search.brave.com/res/v1/web/search");
      url.searchParams.set("q", query);
      url.searchParams.set("count", String(count ?? 5));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url.toString(), {
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": apiKey,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json() as { web?: { results?: Array<{ title: string; url: string; description: string }> } };
      const results = (data.web?.results ?? []).map((r) => ({
        title: r.title,
        url: r.url,
        description: r.description,
      }));
      return JSON.stringify({ results });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return JSON.stringify({ error: "Web search timed out after 30 seconds" });
      }
      return JSON.stringify({ error: `Search failed: ${(err as Error).message}` });
    }
  },
};
