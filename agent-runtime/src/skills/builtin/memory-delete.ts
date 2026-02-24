import { z } from "zod";
import type { SkillDefinition } from "../registry.js";
import { WorkingMemory } from "../../memory/working.js";

export const memoryDeleteSkill: SkillDefinition = {
  name: "memory-delete",
  description: "Delete a key from working memory",
  parameters: z.object({
    key: z.string().describe("The key to delete from working memory"),
  }),
  execute: async (params) => {
    const { key } = params as { key: string };
    const wm = new WorkingMemory("default", "default");
    try {
      const deleted = wm.delete(key);
      return JSON.stringify({ deleted, key });
    } finally {
      wm.close();
    }
  },
};
