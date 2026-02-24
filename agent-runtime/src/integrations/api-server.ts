/**
 * Local REST API server — lets external tools (Shortcuts, Alfred, CLI) talk to agents.
 * Lightweight HTTP server on configurable port with API key auth.
 */

import * as http from "node:http";
import { randomUUID } from "node:crypto";
import type { RpcRouter } from "../rpc/router.js";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ApiServerConfig {
  port: number;
  apiKey: string;
  host?: string;
}

interface ApiRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: number;
  body: unknown;
}

type RouteHandler = (req: ApiRequest) => Promise<ApiResponse>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
}

// ── ApiServer ──────────────────────────────────────────────────────────────

export class ApiServer {
  private server: http.Server | null = null;
  private routes: Route[] = [];
  private config: ApiServerConfig;
  private rpcRouter: RpcRouter | null = null;

  constructor(config: ApiServerConfig) {
    this.config = config;
    this.registerRoutes();
  }

  setRpcRouter(router: RpcRouter): void {
    this.rpcRouter = router;
  }

  // ── Route Registration ─────────────────────────────────────────────────

  private registerRoutes(): void {
    // Health check (no auth)
    this.addRoute("GET", /^\/health$/, async () => ({
      status: 200,
      body: { status: "ok", version: "1.0.0", timestamp: new Date().toISOString() },
    }));

    // Chat — delegates to RPC send_message handler
    this.addRoute("POST", /^\/chat$/, async (req) => {
      const body = req.body as { agentId?: string; message?: string; conversationId?: string };
      if (!body.agentId || !body.message) {
        return { status: 400, body: { error: "agentId and message required" } };
      }
      return this.rpcCall("send_message", {
        agentId: body.agentId,
        message: body.message,
        conversationId: body.conversationId ?? randomUUID(),
      });
    });

    // List agents
    this.addRoute("GET", /^\/agents$/, async () => {
      return this.rpcCall("list_agents", {});
    });

    // List conversations
    this.addRoute("GET", /^\/conversations$/, async (req) => {
      return this.rpcCall("list_conversations", {
        agentId: req.query["agentId"] ?? "",
        limit: parseInt(req.query["limit"] ?? "50", 10),
        offset: parseInt(req.query["offset"] ?? "0", 10),
      });
    });

    // Get usage stats
    this.addRoute("GET", /^\/usage$/, async () => {
      return this.rpcCall("get_usage_stats", {});
    });

    // Get specific conversation
    this.addRoute("GET", /^\/conversations\/([a-zA-Z0-9-]+)$/, async (req) => {
      const match = /^\/conversations\/([a-zA-Z0-9-]+)$/.exec(req.path);
      const id = match?.[1] ?? "";
      return this.rpcCall("load_conversation", { conversationId: id });
    });
  }

  private addRoute(method: string, pattern: RegExp, handler: RouteHandler): void {
    this.routes.push({ method, pattern, handler });
  }

  // ── Server Lifecycle ───────────────────────────────────────────────────

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        // CORS
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");

        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        // Auth (skip for health check)
        const urlPath = (req.url ?? "/").split("?")[0];
        if (urlPath !== "/health") {
          const apiKey = req.headers["x-api-key"] ?? req.headers["authorization"]?.replace("Bearer ", "");
          if (apiKey !== this.config.apiKey) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Unauthorized" }));
            return;
          }
        }

        // Parse request
        const parsedUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
        const query: Record<string, string> = {};
        parsedUrl.searchParams.forEach((v, k) => { query[k] = v; });

        let body: unknown = {};
        if (req.method === "POST" || req.method === "PUT") {
          body = await this.parseBody(req);
        }

        const apiReq: ApiRequest = {
          method: req.method ?? "GET",
          path: urlPath,
          query,
          body,
          headers: req.headers as Record<string, string | string[] | undefined>,
        };

        // Route matching
        const route = this.routes.find(
          (r) => r.method === apiReq.method && r.pattern.test(apiReq.path),
        );

        if (!route) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Not found" }));
          return;
        }

        try {
          const result = await route.handler(apiReq);
          res.writeHead(result.status, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result.body));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: msg }));
        }
      });

      this.server.on("error", reject);
      this.server.listen(this.config.port, this.config.host ?? "127.0.0.1", () => {
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close(() => {
        this.server = null;
        resolve();
      });
    });
  }

  get isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }

  get port(): number {
    return this.config.port;
  }

  // ── RPC Bridge ──────────────────────────────────────────────────────────

  private async rpcCall(method: string, params: Record<string, unknown>): Promise<ApiResponse> {
    if (!this.rpcRouter) return { status: 503, body: { error: "RPC router not initialized" } };
    try {
      const response = await this.rpcRouter.handle({
        jsonrpc: "2.0",
        id: randomUUID(),
        method,
        params,
      });
      if (response.error) {
        return { status: 400, body: { error: response.error.message } };
      }
      return { status: 200, body: response.result };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { status: 500, body: { error: msg } };
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private parseBody(req: http.IncomingMessage): Promise<unknown> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf-8");
        try {
          resolve(JSON.parse(raw));
        } catch {
          resolve({});
        }
      });
      req.on("error", () => resolve({}));
    });
  }
}

// ── Factory ────────────────────────────────────────────────────────────────

export function createApiServer(config: Partial<ApiServerConfig> = {}): ApiServer {
  return new ApiServer({
    port: config.port ?? 9876,
    apiKey: config.apiKey ?? randomUUID(),
    host: config.host ?? "127.0.0.1",
  });
}
