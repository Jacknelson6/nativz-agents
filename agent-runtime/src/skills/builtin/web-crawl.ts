import { z } from "zod";
import type { SkillDefinition } from "../registry.js";
import { BrowserManager } from "../../browser/manager.js";

export const webCrawlSkill: SkillDefinition = {
  name: "web-crawl",
  description: "Crawl a web page and extract its text content, links, and metadata.",
  parameters: z.object({
    url: z.string().url().describe("URL to crawl"),
    selector: z.string().optional().describe("CSS selector to extract specific content"),
    waitFor: z.string().optional().describe("CSS selector to wait for before extracting"),
  }),
  execute: async (params) => {
    const { url, selector, waitFor } = params as {
      url: string; selector?: string; waitFor?: string;
    };
    const manager = BrowserManager.getInstance();
    const page = await manager.newPage();
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      if (waitFor) {
        await page.waitForSelector(waitFor, { timeout: 10000 }).catch(() => {});
      }
      const result = await page.evaluate((sel?: string) => {
        const target = sel ? document.querySelector(sel) : document.body;
        if (!target) return { text: "", title: document.title, links: [] as Array<{text:string,href:string}>, h1s: [] as string[], h2s: [] as string[], metaDescription: "" };
        const text = (target as HTMLElement).innerText || target.textContent || "";
        const title = document.title;
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
        const links = Array.from(document.querySelectorAll("a[href]"))
          .slice(0, 100)
          .map((a) => ({ text: a.textContent?.trim() ?? "", href: (a as HTMLAnchorElement).href }));
        const h1s = Array.from(document.querySelectorAll("h1")).map((h) => h.textContent?.trim() ?? "");
        const h2s = Array.from(document.querySelectorAll("h2")).map((h) => h.textContent?.trim() ?? "");
        return { text: text.slice(0, 50000), title, metaDescription: metaDesc, links, h1s, h2s };
      }, selector);
      return JSON.stringify(result);
    } catch (err) {
      return JSON.stringify({ error: `Crawl failed: ${(err as Error).message}` });
    } finally {
      await page.close();
    }
  },
};
