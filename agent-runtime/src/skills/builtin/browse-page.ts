import { z } from "zod";
import type { SkillDefinition } from "../registry.js";
import { BrowserManager } from "../../browser/manager.js";

export const browsePageSkill: SkillDefinition = {
  name: "browse-page",
  description:
    "Browse a webpage and extract its structure using a headless browser. Returns page title, meta description, canonical URL, robots directives, OG tags, headings (H1-H3), link count, image count, and body text.",
  parameters: z.object({
    url: z.string().url().describe("URL to browse"),
    selector: z
      .string()
      .optional()
      .describe("Optional CSS selector to scope extraction to a specific element"),
  }),
  execute: async (params) => {
    const { url, selector } = params as { url: string; selector?: string };
    const manager = BrowserManager.getInstance();
    const page = await manager.newPage();
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

      const result = await page.evaluate((sel?: string) => {
        const root = sel ? document.querySelector(sel) : document.body;
        if (!root) {
          return { error: sel ? `Selector "${sel}" not found` : "No body element" };
        }

        const getMeta = (name: string) =>
          document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ??
          document.querySelector(`meta[property="${name}"]`)?.getAttribute("content") ??
          "";

        const title = document.title;
        const metaDescription = getMeta("description");
        const canonical =
          document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "";
        const robots = getMeta("robots");
        const ogTitle = getMeta("og:title");
        const ogDescription = getMeta("og:description");
        const ogImage = getMeta("og:image");
        const ogType = getMeta("og:type");

        const headings = {
          h1: Array.from(root.querySelectorAll("h1")).map((h) => h.textContent?.trim() ?? ""),
          h2: Array.from(root.querySelectorAll("h2")).map((h) => h.textContent?.trim() ?? ""),
          h3: Array.from(root.querySelectorAll("h3")).map((h) => h.textContent?.trim() ?? ""),
        };

        const linkCount = root.querySelectorAll("a[href]").length;
        const imageCount = root.querySelectorAll("img").length;
        const bodyText = ((root as HTMLElement).innerText || root.textContent || "").slice(0, 50000);

        return {
          title,
          metaDescription,
          canonical,
          robots,
          og: { title: ogTitle, description: ogDescription, image: ogImage, type: ogType },
          headings,
          linkCount,
          imageCount,
          bodyText,
        };
      }, selector);

      return JSON.stringify({ success: true, url, ...result });
    } catch (err) {
      return JSON.stringify({ success: false, error: (err as Error).message });
    } finally {
      await page.close();
    }
  },
};
