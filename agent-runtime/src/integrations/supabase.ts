import { createClient, SupabaseClient as SupabaseSDKClient } from "@supabase/supabase-js";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface QueryFilter {
  column: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "is";
  value: unknown;
}

export class SupabaseIntegration {
  private client: SupabaseSDKClient | null = null;
  private config: SupabaseConfig | null = null;

  configure(config: SupabaseConfig): void {
    this.config = config;
    this.client = createClient(config.url, config.anonKey);
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  private getClient(): SupabaseSDKClient {
    if (!this.client) {
      throw new Error("Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in settings.");
    }
    return this.client;
  }

  async query(
    table: string,
    filters?: QueryFilter[],
    options?: { select?: string; limit?: number; offset?: number; orderBy?: string; ascending?: boolean }
  ): Promise<{ data: unknown[]; count: number | null }> {
    const client = this.getClient();
    let query = client.from(table).select(options?.select ?? "*", { count: "exact" });

    if (filters) {
      for (const f of filters) {
        switch (f.operator) {
          case "eq": query = query.eq(f.column, f.value); break;
          case "neq": query = query.neq(f.column, f.value); break;
          case "gt": query = query.gt(f.column, f.value); break;
          case "gte": query = query.gte(f.column, f.value); break;
          case "lt": query = query.lt(f.column, f.value); break;
          case "lte": query = query.lte(f.column, f.value); break;
          case "like": query = query.like(f.column, f.value as string); break;
          case "ilike": query = query.ilike(f.column, f.value as string); break;
          case "in": query = query.in(f.column, f.value as unknown[]); break;
          case "is": query = query.is(f.column, f.value as null); break;
        }
      }
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? true });
    }
    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options?.limit ?? 20) - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(`Supabase query error: ${error.message}`);
    return { data: data ?? [], count };
  }

  async insert(table: string, data: Record<string, unknown> | Record<string, unknown>[]): Promise<unknown[]> {
    const client = this.getClient();
    const { data: result, error } = await client.from(table).insert(data).select();
    if (error) throw new Error(`Supabase insert error: ${error.message}`);
    return result ?? [];
  }

  async update(
    table: string,
    filters: QueryFilter[],
    data: Record<string, unknown>
  ): Promise<unknown[]> {
    const client = this.getClient();
    let query = client.from(table).update(data);

    for (const f of filters) {
      if (f.operator === "eq") query = query.eq(f.column, f.value);
      else if (f.operator === "neq") query = query.neq(f.column, f.value);
    }

    const { data: result, error } = await query.select();
    if (error) throw new Error(`Supabase update error: ${error.message}`);
    return result ?? [];
  }

  async delete(table: string, filters: QueryFilter[]): Promise<unknown[]> {
    const client = this.getClient();
    let query = client.from(table).delete();

    for (const f of filters) {
      if (f.operator === "eq") query = query.eq(f.column, f.value);
    }

    const { data: result, error } = await query.select();
    if (error) throw new Error(`Supabase delete error: ${error.message}`);
    return result ?? [];
  }

  async rpc(functionName: string, params?: Record<string, unknown>): Promise<unknown> {
    const client = this.getClient();
    const { data, error } = await client.rpc(functionName, params);
    if (error) throw new Error(`Supabase RPC error: ${error.message}`);
    return data;
  }
}

// Singleton
export const supabase = new SupabaseIntegration();
