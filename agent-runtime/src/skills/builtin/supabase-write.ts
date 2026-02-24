import { z } from "zod";
import type { SkillDefinition } from "../registry.js";
import { supabase, type QueryFilter } from "../../integrations/supabase.js";

const filterSchema = z.array(z.object({
  column: z.string(),
  operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "in", "is"]),
  value: z.any(),
}));

export const supabaseInsertSkill: SkillDefinition = {
  name: "supabase-insert",
  description: "Insert one or more rows into a Supabase table. Returns the inserted rows.",
  parameters: z.object({
    table: z.string().describe("Table name"),
    data: z.any().describe("Object or array of objects to insert. Each key is a column name."),
  }),
  execute: async (params: Record<string, unknown>): Promise<string> => {
    if (!supabase.isConfigured()) {
      return "Error: Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in app settings.";
    }
    try {
      const result = await supabase.insert(
        params.table as string,
        params.data as Record<string, unknown> | Record<string, unknown>[]
      );
      return JSON.stringify({ inserted: result.length, data: result }, null, 2);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};

export const supabaseUpdateSkill: SkillDefinition = {
  name: "supabase-update",
  description: "Update rows in a Supabase table matching the given filters. Returns updated rows.",
  parameters: z.object({
    table: z.string().describe("Table name"),
    filters: filterSchema.describe("Filters to match rows"),
    data: z.record(z.any()).describe("Object with column:value pairs to update"),
  }),
  execute: async (params: Record<string, unknown>): Promise<string> => {
    if (!supabase.isConfigured()) {
      return "Error: Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in app settings.";
    }
    try {
      const result = await supabase.update(
        params.table as string,
        params.filters as QueryFilter[],
        params.data as Record<string, unknown>
      );
      return JSON.stringify({ updated: result.length, data: result }, null, 2);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};

export const supabaseDeleteSkill: SkillDefinition = {
  name: "supabase-delete",
  description: "Delete rows from a Supabase table matching the given filters. Returns deleted rows.",
  parameters: z.object({
    table: z.string().describe("Table name"),
    filters: filterSchema.describe("Filters to match rows for deletion"),
  }),
  execute: async (params: Record<string, unknown>): Promise<string> => {
    if (!supabase.isConfigured()) {
      return "Error: Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in app settings.";
    }
    try {
      const result = await supabase.delete(
        params.table as string,
        params.filters as QueryFilter[]
      );
      return JSON.stringify({ deleted: result.length, data: result }, null, 2);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};
