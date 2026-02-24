import { z } from "zod";
import type { SkillDefinition } from "../registry.js";
import { BrowserManager } from "../../browser/manager.js";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

export const screenshotSkill: SkillDefinition = {
  name: "screenshot",
  description: "Take a screenshot of a web page at the given URL. Returns base64 PNG.",
  parameters: z.object({
    url: z.string().url().describe("URL to screenshot"),
    fullPage: z.boolean().optional().default(false).describe("Capture full page"),
    width: z.number().optional().default(1280).describe("Viewport width"),
    height: z.number().optional().default(720).describe("Viewport height"),
  }),
  execute: async (params) => {
    const { url, fullPage, width, height } = params as {
      url: string; fullPage?: boolean; width?: number; height?: number;
    };
    const manager = BrowserManager.getInstance();
    const page = await manager.newPage({ width: width ?? 1280, height: height ?? 720 });
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      const buffer = await withTimeout(
        page.screenshot({ fullPage: fullPage ?? false, type: "png" }),
        20000,
        "Screenshot capture"
      );
      const base64 = Buffer.from(buffer).toString("base64");
      return JSON.stringify({
        success: true,
        url,
        format: "png",
        base64,
        sizeBytes: buffer.byteLength,
      });
    } catch (err) {
      return JSON.stringify({ error: `Screenshot failed: ${(err as Error).message}` });
    } finally {
      await page.close();
    }
  },
};
