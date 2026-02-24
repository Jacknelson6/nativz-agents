import { McpClient, type McpServerConfig } from "./client.js";

export type ServerState = "starting" | "running" | "stopped" | "error";

export interface McpServerStatus {
  name: string;
  state: ServerState;
  config: McpServerConfig;
  startedAt: number | null;
  restartCount: number;
  lastError: string | null;
}

interface ManagedServer {
  client: McpClient;
  config: McpServerConfig;
  status: McpServerStatus;
  backoffMs: number;
  restartTimer: ReturnType<typeof setTimeout> | null;
}

const MIN_BACKOFF = 1000;
const MAX_BACKOFF = 30000;

export class McpServerManager {
  private servers = new Map<string, ManagedServer>();
  private shutdownRequested = false;

  async startServer(name: string, config: McpServerConfig): Promise<McpServerStatus> {
    if (this.servers.has(name)) {
      await this.stopServer(name);
    }

    const status: McpServerStatus = {
      name,
      state: "starting",
      config,
      startedAt: null,
      restartCount: 0,
      lastError: null,
    };

    const client = new McpClient(name);
    const managed: ManagedServer = {
      client,
      config,
      status,
      backoffMs: MIN_BACKOFF,
      restartTimer: null,
    };

    this.servers.set(name, managed);

    try {
      await client.connect(config);
      managed.status.state = "running";
      managed.status.startedAt = Date.now();
      managed.backoffMs = MIN_BACKOFF;
    } catch (err) {
      managed.status.state = "error";
      managed.status.lastError = err instanceof Error ? err.message : String(err);
      this.scheduleRestart(name);
    }

    return { ...managed.status };
  }

  async stopServer(name: string): Promise<void> {
    const managed = this.servers.get(name);
    if (!managed) return;

    if (managed.restartTimer) {
      clearTimeout(managed.restartTimer);
      managed.restartTimer = null;
    }

    try {
      await managed.client.disconnect();
    } catch {
      // ignore disconnect errors
    }

    managed.status.state = "stopped";
    this.servers.delete(name);
  }

  async restartServer(name: string): Promise<McpServerStatus> {
    const managed = this.servers.get(name);
    if (!managed) {
      throw new Error(`Server not found: ${name}`);
    }

    const config = managed.config;
    await this.stopServer(name);
    return this.startServer(name, config);
  }

  async healthCheck(name: string): Promise<boolean> {
    const managed = this.servers.get(name);
    if (!managed || managed.status.state !== "running") return false;

    try {
      await managed.client.listTools();
      return true;
    } catch {
      managed.status.state = "error";
      managed.status.lastError = "Health check failed";
      this.scheduleRestart(name);
      return false;
    }
  }

  listServers(): McpServerStatus[] {
    return Array.from(this.servers.values()).map((m) => ({ ...m.status }));
  }

  getClient(name: string): McpClient | undefined {
    return this.servers.get(name)?.client;
  }

  async shutdownAll(): Promise<void> {
    this.shutdownRequested = true;
    const names = Array.from(this.servers.keys());
    await Promise.allSettled(names.map((n) => this.stopServer(n)));
  }

  private scheduleRestart(name: string): void {
    if (this.shutdownRequested) return;

    const managed = this.servers.get(name);
    if (!managed) return;

    managed.restartTimer = setTimeout(async () => {
      managed.restartTimer = null;
      managed.status.restartCount++;
      managed.status.state = "starting";

      const newClient = new McpClient(name);
      managed.client = newClient;

      try {
        await newClient.connect(managed.config);
        managed.status.state = "running";
        managed.status.startedAt = Date.now();
        managed.status.lastError = null;
        managed.backoffMs = MIN_BACKOFF;
      } catch (err) {
        managed.status.state = "error";
        managed.status.lastError = err instanceof Error ? err.message : String(err);
        managed.backoffMs = Math.min(managed.backoffMs * 2, MAX_BACKOFF);
        this.scheduleRestart(name);
      }
    }, managed.backoffMs);
  }
}
