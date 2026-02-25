import { z } from "zod";
import type { SkillDefinition, SkillExecutionContext } from "../registry.js";

export const memoryListSkill: SkillDefinition = {
  name: "memory-list",
  description: "List all entries in working memory",
  parameters: z.object({}),
  execute: async (_params, context?: SkillExecutionContext) => {
    const wm = context?.workingMemory;
    if (!wm) {
      return JSON.stringify({ entries: {}, count: 0, error: "No working memory available — start a conversation first" });
    }
    const entries = wm.list();
    return JSON.stringify({ entries, count: Object.keys(entries).length });
  },
};
