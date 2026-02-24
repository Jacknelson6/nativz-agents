import { z } from "zod";
import type { SkillDefinition } from "../registry.js";
import { WorkingMemory } from "../../memory/working.js";

export const memoryWriteSkill: SkillDefinition = {
  name: "memory-write",
  description: "Write a key-value pair to working memory",
  parameters: z.object({
    key: z.string().describe("The key to store"),
    value: z.string().describe("The value to store"),
  }),
  execute: async (params) => {
    const { key, value } = params as { key: string; value: string };
    const wm = new WorkingMemory("default", "default");
    try {
      const success = wm.set(key, value);
      if (!success) {
        return JSON.stringify({ success: false, error: "Working memory size limit exceeded" });
      }
      return JSON.stringify({ success: true, key });
    } finally {
      wm.close();
    }
  },
};
