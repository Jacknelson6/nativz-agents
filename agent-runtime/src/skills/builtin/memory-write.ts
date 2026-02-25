import { z } from "zod";
import type { SkillDefinition, SkillExecutionContext } from "../registry.js";

export const memoryWriteSkill: SkillDefinition = {
  name: "memory-write",
  description: "Write a key-value pair to working memory",
  parameters: z.object({
    key: z.string().describe("The key to store"),
    value: z.string().describe("The value to store"),
  }),
  execute: async (params, context?: SkillExecutionContext) => {
    const { key, value } = params as { key: string; value: string };
    const wm = context?.workingMemory;
    if (!wm) {
      return JSON.stringify({ success: false, error: "No working memory available — start a conversation first" });
    }
    const success = wm.set(key, value);
    if (!success) {
      return JSON.stringify({ success: false, error: "Working memory size limit exceeded" });
    }
    return JSON.stringify({ success: true, key });
  },
};
