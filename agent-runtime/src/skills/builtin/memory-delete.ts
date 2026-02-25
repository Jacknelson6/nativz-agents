import { z } from "zod";
import type { SkillDefinition, SkillExecutionContext } from "../registry.js";

export const memoryDeleteSkill: SkillDefinition = {
  name: "memory-delete",
  description: "Delete a key from working memory",
  parameters: z.object({
    key: z.string().describe("The key to delete from working memory"),
  }),
  execute: async (params, context?: SkillExecutionContext) => {
    const { key } = params as { key: string };
    const wm = context?.workingMemory;
    if (!wm) {
      return JSON.stringify({ deleted: false, key, error: "No working memory available — start a conversation first" });
    }
    const deleted = wm.delete(key);
    return JSON.stringify({ deleted, key });
  },
};
