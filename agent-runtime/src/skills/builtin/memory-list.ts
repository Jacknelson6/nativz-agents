import { z } from "zod";
import type { SkillDefinition } from "../registry.js";
import { WorkingMemory } from "../../memory/working.js";

export const memoryListSkill: SkillDefinition = {
  name: "memory-list",
  description: "List all entries in working memory",
  parameters: z.object({}),
  execute: async () => {
    const wm = new WorkingMemory("default", "default");
    try {
      const entries = wm.list();
      return JSON.stringify({ entries, count: Object.keys(entries).length });
    } finally {
      wm.close();
    }
  },
};
