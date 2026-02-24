/**
 * Live Context Injection — inject real-time data into agent context each turn.
 * Plugin system: register providers that return fresh data on demand.
 */

import * as os from "node:os";

// ---- Types ----

export interface LiveContextData {
  name: string;
  content: string;
  /** TTL in ms — cached result reused within this window */
  ttlMs?: number;
  priority?: number;
}

export interface LiveContextPlugin {
  name: string;
  description: string;
  enabled: boolean;
  /** Return live context data, or null to skip this turn */
  fetch(): Promise<LiveContextData | null>;
}

export interface LiveContextProviderConfig {
  maxTotalTokens?: number;
  defaultTtlMs?: number;
}

interface CacheEntry {
  data: LiveContextData;
  fetchedAt: number;
}

// ---- Built-in Providers ----

class DateTimeProvider implements LiveContextPlugin {
  name = "datetime";
  description = "Current date, time, timezone, and day of week";
  enabled = true;

  async fetch(): Promise<LiveContextData> {
    const now = new Date();
    const content = [
      `Date: ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
      `Time: ${now.toLocaleTimeString("en-US", { hour12: true })}`,
      `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
      `Unix: ${Math.floor(now.getTime() / 1000)}`,
    ].join("\n");

    return { name: "datetime", content, ttlMs: 30_000, priority: 10 };
  }
}

class SystemInfoProvider implements LiveContextPlugin {
  name = "system_info";
  description = "OS, CPU, and memory usage";
  enabled = true;

  async fetch(): Promise<LiveContextData> {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedPct = (((totalMem - freeMem) / totalMem) * 100).toFixed(1);
    const upHours = (os.uptime() / 3600).toFixed(1);

    const content = [
      `OS: ${os.type()} ${os.release()} (${os.arch()})`,
      `CPU: ${os.cpus()[0]?.model ?? "unknown"} × ${os.cpus().length} cores`,
      `Memory: ${usedPct}% used (${formatBytes(totalMem - freeMem)} / ${formatBytes(totalMem)})`,
      `Uptime: ${upHours}h`,
      `Hostname: ${os.hostname()}`,
    ].join("\n");

    return { name: "system_info", content, ttlMs: 60_000, priority: 5 };
  }
}

class CustomApiProvider implements LiveContextPlugin {
  name: string;
  description: string;
  enabled = true;
  private url: string;
  private transform: (data: unknown) => string;
  private ttl: number;

  constructor(config: {
    name: string;
    description: string;
    url: string;
    ttlMs?: number;
    transform?: (data: unknown) => string;
  }) {
    this.name = config.name;
    this.description = config.description;
    this.url = config.url;
    this.ttl = config.ttlMs ?? 120_000;
    this.transform = config.transform ?? ((d) => JSON.stringify(d, null, 2));
  }

  async fetch(): Promise<LiveContextData | null> {
    try {
      const resp = await fetch(this.url, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) return null;
      const data: unknown = await resp.json();
      return { name: this.name, content: this.transform(data), ttlMs: this.ttl, priority: 3 };
    } catch {
      return null;
    }
  }
}

// ---- Main Provider ----

export class LiveContextProvider {
  private plugins: LiveContextPlugin[] = [];
  private cache = new Map<string, CacheEntry>();
  private config: Required<LiveContextProviderConfig>;

  constructor(config?: LiveContextProviderConfig) {
    this.config = {
      maxTotalTokens: config?.maxTotalTokens ?? 2048,
      defaultTtlMs: config?.defaultTtlMs ?? 60_000,
    };

    // Register built-in providers
    this.register(new DateTimeProvider());
    this.register(new SystemInfoProvider());
  }

  register(plugin: LiveContextPlugin): void {
    const existing = this.plugins.findIndex((p) => p.name === plugin.name);
    if (existing >= 0) {
      this.plugins[existing] = plugin;
    } else {
      this.plugins.push(plugin);
    }
  }

  unregister(name: string): void {
    this.plugins = this.plugins.filter((p) => p.name !== name);
    this.cache.delete(name);
  }

  registerApiProvider(config: {
    name: string;
    description: string;
    url: string;
    ttlMs?: number;
    transform?: (data: unknown) => string;
  }): void {
    this.register(new CustomApiProvider(config));
  }

  enablePlugin(name: string, enabled: boolean): void {
    const plugin = this.plugins.find((p) => p.name === name);
    if (plugin) plugin.enabled = enabled;
  }

  listPlugins(): Array<{ name: string; description: string; enabled: boolean }> {
    return this.plugins.map((p) => ({
      name: p.name,
      description: p.description,
      enabled: p.enabled,
    }));
  }

  /**
   * Gather all live context and return as XML block for injection into system prompt.
   */
  async gather(): Promise<string> {
    const results: LiveContextData[] = [];

    await Promise.all(
      this.plugins
        .filter((p) => p.enabled)
        .map(async (plugin) => {
          // Check cache
          const cached = this.cache.get(plugin.name);
          const ttl = cached?.data.ttlMs ?? this.config.defaultTtlMs;
          if (cached && Date.now() - cached.fetchedAt < ttl) {
            results.push(cached.data);
            return;
          }

          try {
            const data = await plugin.fetch();
            if (data) {
              this.cache.set(plugin.name, { data, fetchedAt: Date.now() });
              results.push(data);
            }
          } catch {
            // Plugin failed — use stale cache if available
            if (cached) results.push(cached.data);
          }
        })
    );

    // Sort by priority (higher first), then trim to token budget
    results.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    let tokenBudget = this.config.maxTotalTokens;
    const included: LiveContextData[] = [];
    for (const item of results) {
      const tokens = estimateTokens(item.content);
      if (tokens <= tokenBudget) {
        included.push(item);
        tokenBudget -= tokens;
      }
    }

    if (included.length === 0) return "";

    const sections = included
      .map((d) => `  <${d.name}>\n${indent(d.content, 4)}\n  </${d.name}>`)
      .join("\n");

    return `<live_context>\n${sections}\n</live_context>`;
  }

  /**
   * Inject live context into an existing system prompt.
   */
  async injectIntoPrompt(systemPrompt: string): Promise<string> {
    const contextBlock = await this.gather();
    if (!contextBlock) return systemPrompt;
    return `${systemPrompt}\n\n${contextBlock}`;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// ---- Helpers ----

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}GB`;
}

function indent(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((l) => pad + l)
    .join("\n");
}
