import { z } from "zod";
import type { SkillDefinition, SkillExecutionContext } from "../registry.js";

export const memoryReadSkill: SkillDefinition = {
  name: "memory-read",
  description: "Read a value from working memory by key",
  parameters: z.object({
    key: z.string().describe("The key to read from working memory"),
  }),
  execute: async (params, context?: SkillExecutionContext) => {
    const { key } = params as { key: string };
    const wm = context?.workingMemory;
    if (!wm) {
      return JSON.stringify({ found: false, key, error: "No working memory available — start a conversation first" });
    }
    const value = wm.get(key);
    if (value === null) {
      return JSON.stringify({ found: false, key });
    }
    return JSON.stringify({ found: true, key, value });
  },
};
