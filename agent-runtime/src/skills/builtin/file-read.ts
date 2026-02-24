import { z } from "zod";
import * as fs from "node:fs/promises";
import type { SkillDefinition } from "../registry.js";

export const fileReadSkill: SkillDefinition = {
  name: "file-read",
  description: "Read the contents of a file from disk",
  parameters: z.object({
    path: z.string().describe("Absolute or relative file path to read"),
    encoding: z.string().optional().default("utf-8").describe("File encoding"),
  }),
  execute: async (params) => {
    const { path, encoding } = params as { path: string; encoding?: string };
    try {
      const content = await fs.readFile(path, { encoding: (encoding ?? "utf-8") as BufferEncoding });
      return content;
    } catch (err) {
      return JSON.stringify({ error: `Failed to read file: ${(err as Error).message}` });
    }
  },
};
