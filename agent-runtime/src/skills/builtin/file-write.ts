import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { SkillDefinition } from "../registry.js";

export const fileWriteSkill: SkillDefinition = {
  name: "file-write",
  description: "Write content to a file on disk. Creates directories if needed.",
  parameters: z.object({
    path: z.string().describe("File path to write to"),
    content: z.string().describe("Content to write"),
    append: z.boolean().optional().default(false).describe("Append instead of overwrite"),
  }),
  execute: async (params) => {
    const { path: filePath, content, append } = params as { path: string; content: string; append?: boolean };
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      if (append) {
        await fs.appendFile(filePath, content, "utf-8");
      } else {
        await fs.writeFile(filePath, content, "utf-8");
      }
      return JSON.stringify({ success: true, path: filePath, bytes: Buffer.byteLength(content) });
    } catch (err) {
      return JSON.stringify({ error: `Failed to write file: ${(err as Error).message}` });
    }
  },
};
