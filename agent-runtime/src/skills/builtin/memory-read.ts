import { z } from "zod";
import type { SkillDefinition } from "../registry.js";
import { WorkingMemory } from "../../memory/working.js";

export const memoryReadSkill: SkillDefinition = {
  name: "memory-read",
  description: "Read a value from working memory by key",
  parameters: z.object({
    key: z.string().describe("The key to read from working memory"),
  }),
  execute: async (params) => {
    const { key } = params as { key: string };
    const wm = new WorkingMemory("default", "default");
    try {
      const value = wm.get(key);
      if (value === null) {
        return JSON.stringify({ found: false, key });
      }
      return JSON.stringify({ found: true, key, value });
    } finally {
      wm.close();
    }
  },
};
