import { z } from "zod";
import type { SkillDefinition } from "../registry.js";
import { supabase, type QueryFilter } from "../../integrations/supabase.js";

export const supabaseQuerySkill: SkillDefinition = {
  name: "supabase-query",
  description: "Query data from a Supabase table. Supports filtering, ordering, pagination, and column selection.",
  parameters: z.object({
    table: z.string().describe("Table name to query"),
    select: z.string().optional().describe("Columns to select (default: *). Supports Supabase select syntax like 'id,name,posts(title)'"),
    filters: z.array(z.object({
      column: z.string(),
      operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "in", "is"]),
      value: z.any(),
    })).optional().describe("Array of filter objects"),
    orderBy: z.string().optional().describe("Column to order by"),
    ascending: z.boolean().optional().describe("Sort ascending (default: true)"),
    limit: z.number().optional().describe("Max rows to return (default: 20)"),
    offset: z.number().optional().describe("Row offset for pagination"),
  }),
  execute: async (params: Record<string, unknown>): Promise<string> => {
    if (!supabase.isConfigured()) {
      return "Error: Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in app settings.";
    }
    try {
      const result = await supabase.query(
        params.table as string,
        params.filters as QueryFilter[] | undefined,
        {
          select: params.select as string | undefined,
          limit: (params.limit as number) ?? 20,
          offset: params.offset as number | undefined,
          orderBy: params.orderBy as string | undefined,
          ascending: params.ascending as boolean | undefined,
        }
      );
      return JSON.stringify({ rowCount: result.data.length, totalCount: result.count, data: result.data }, null, 2);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};
