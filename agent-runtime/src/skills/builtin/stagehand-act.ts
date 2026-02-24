import { z } from "zod";
import type { SkillDefinition } from "../registry.js";
import { StagehandManager } from "../../browser/stagehand.js";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

export const stagehandActSkill: SkillDefinition = {
  name: "stagehand-act",
  description:
    "Perform a browser action described in natural language using AI-powered automation. Can click buttons, fill forms, navigate menus, and interact with any web page element without needing CSS selectors.",
  parameters: z.object({
    url: z.string().url().describe("URL to navigate to before performing the action"),
    instruction: z
      .string()
      .describe('Natural language instruction for the browser action, e.g. "click the search button" or "fill in the email field with test@example.com"'),
  }),
  execute: async (params) => {
    const { url, instruction } = params as { url: string; instruction: string };
    const manager = StagehandManager.getInstance();
    try {
      await manager.init();
      await manager.navigate(url);
      const result = await withTimeout(manager.act(instruction), 45000, "Stagehand act");
      return JSON.stringify({ success: true, result });
    } catch (err) {
      return JSON.stringify({ success: false, error: (err as Error).message });
    }
  },
};
