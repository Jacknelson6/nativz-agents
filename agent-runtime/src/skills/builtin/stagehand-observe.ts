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

export const stagehandObserveSkill: SkillDefinition = {
  name: "stagehand-observe",
  description:
    "Observe and describe elements on a webpage using AI. Useful for understanding page structure, finding interactive elements, or analyzing competitor content layouts.",
  parameters: z.object({
    url: z.string().url().describe("URL to observe"),
    instruction: z
      .string()
      .describe('Natural language description of what to observe, e.g. "what navigation elements are on this page?" or "describe the layout and main content sections"'),
  }),
  execute: async (params) => {
    const { url, instruction } = params as { url: string; instruction: string };
    const manager = StagehandManager.getInstance();
    try {
      await manager.init();
      await manager.navigate(url);
      const result = await withTimeout(manager.observe(instruction), 45000, "Stagehand observe");
      return JSON.stringify({ success: true, observations: result });
    } catch (err) {
      return JSON.stringify({ success: false, error: (err as Error).message });
    }
  },
};
