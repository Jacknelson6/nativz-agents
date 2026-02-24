import { RpcRouter } from "./rpc/router.js";
import { RpcServer } from "./rpc/server.js";
import { AgentRuntime } from "./agent/runtime.js";
import { listAgents } from "./agent/loader.js";
import * as path from "node:path";

const router = new RpcRouter();
let agentsDir = path.resolve(__dirname, "../../agents");
let apiKey: string | undefined;

// Track per-agent runtimes so we can load on demand
const runtimes = new Map<string, AgentRuntime>();

async function getOrLoadRuntime(agentId: string): Promise<AgentRuntime> {
  let rt = runtimes.get(agentId);
  if (rt) return rt;
  rt = new AgentRuntime(apiKey);
  const manifestPath = path.join(agentsDir, agentId, "manifest.json");
  await rt.loadAgent(manifestPath);
  runtimes.set(agentId, rt);
  return rt;
}

router.register("initialize", async (params) => {
  if (params.agentsDir) {
    agentsDir = params.agentsDir as string;
  }
  if (params.apiKey) {
    apiKey = params.apiKey as string;
  }
  const agentId = params.agentId as string | undefined;
  if (!agentId) {
    return { status: "ready", message: "Runtime initialized.", agentsDir };
  }
  const rt = await getOrLoadRuntime(agentId);
  const manifest = rt.getManifest();
  return {
    status: "ready",
    agent: manifest ? { id: manifest.id, name: manifest.name, description: manifest.description } : null,
  };
});

// Helper to emit a JSON-RPC notification (no id = notification)
function emitNotification(method: string, params: Record<string, unknown>): void {
  const notification = JSON.stringify({ jsonrpc: "2.0", method, params });
  process.stdout.write(notification + "\n");
}

router.register("send_message", async (params) => {
  const agentId = params.agentId as string;
  const message = params.message as string;
  const userId = (params.userId as string) ?? "default";
  const requestId = params.requestId as string | undefined ?? crypto.randomUUID();
  if (!agentId) throw new Error("agentId is required");
  if (!message) throw new Error("message is required");
  if (!apiKey && !process.env.ANTHROPIC_API_KEY) {
    throw new Error("API key not configured. Please set your API key in Settings.");
  }
  const rt = await getOrLoadRuntime(agentId);
  const response = await rt.sendMessage(message, userId, (type, data) => {
    emitNotification("stream_chunk", { requestId, agentId, type, ...data });
  });
  return { response };
});

router.register("list_agents", async () => {
  const agents = await listAgents(agentsDir);
  return {
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
    })),
  };
});

router.register("get_history", async (params) => {
  const agentId = params.agentId as string | undefined;
  if (agentId && runtimes.has(agentId)) {
    return { messages: runtimes.get(agentId)!.getHistory() };
  }
  return { messages: [] };
});

router.register("set_api_key", async (params) => {
  apiKey = params.apiKey as string;
  // Clear existing runtimes so they get recreated with new key
  for (const rt of runtimes.values()) {
    await rt.shutdown();
  }
  runtimes.clear();
  return { status: "ok" };
});

router.register("shutdown", async () => {
  for (const rt of runtimes.values()) {
    await rt.shutdown();
  }
  runtimes.clear();
  setTimeout(() => process.exit(0), 100);
  return { status: "shutting_down" };
});

// Start the server
const server = new RpcServer(router);
server.start();

// Log to stderr so it doesn't interfere with JSON-RPC on stdout
process.stderr.write("agent-runtime: RPC server started\n");
