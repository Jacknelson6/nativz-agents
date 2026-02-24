import { z } from "zod";
import type { SkillDefinition } from "../registry.js";

export const httpRequestSkill: SkillDefinition = {
  name: "http-request",
  description: "Make HTTP requests (GET, POST, PUT, DELETE) and return the response",
  parameters: z.object({
    url: z.string().url().describe("URL to request"),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).optional().default("GET"),
    headers: z.record(z.string()).optional().describe("Request headers"),
    body: z.string().optional().describe("Request body (for POST/PUT/PATCH)"),
  }),
  execute: async (params) => {
    const { url, method, headers, body } = params as {
      url: string; method: string; headers?: Record<string, string>; body?: string;
    };
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      const response = await fetch(url, {
        method: method ?? "GET",
        headers,
        body: body && method !== "GET" ? body : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const text = await response.text();
      return JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: text.slice(0, 50000),
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return JSON.stringify({ error: "HTTP request timed out after 30 seconds" });
      }
      return JSON.stringify({ error: `HTTP request failed: ${(err as Error).message}` });
    }
  },
};
