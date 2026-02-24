import { z } from "zod";
import type { SkillDefinition } from "../registry.js";
import { StagehandManager } from "../../browser/stagehand.js";

export const stagehandExtractSkill: SkillDefinition = {
  name: "stagehand-extract",
  description:
    "Extract structured data from a webpage using natural language instructions and AI. Describe what data you want and get it back as structured JSON.",
  parameters: z.object({
    url: z.string().url().describe("URL to extract data from"),
    instruction: z
      .string()
      .describe('Natural language description of what to extract, e.g. "get all product names and prices" or "extract the main article text and author"'),
  }),
  execute: async (params) => {
    const { url, instruction } = params as { url: string; instruction: string };
    const manager = StagehandManager.getInstance();
    try {
      await manager.init();
      await manager.navigate(url);
      const result = await manager.extract(instruction);
      return JSON.stringify({ success: true, data: result });
    } catch (err) {
      return JSON.stringify({ success: false, error: (err as Error).message });
    }
  },
};
