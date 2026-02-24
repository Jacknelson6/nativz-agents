import "dotenv/config";
import { RpcRouter } from "./rpc/router.js";
import { RpcServer } from "./rpc/server.js";
import { AgentRuntime } from "./agent/runtime.js";
import { listAgents } from "./agent/loader.js";
import type { EntityType } from "./memory/structured.js";
import { supabase } from "./integrations/supabase.js";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  // Configure Supabase if credentials provided
  const supabaseUrl = (params.supabaseUrl as string) || process.env.SUPABASE_URL;
  const supabaseKey = (params.supabaseAnonKey as string) || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    supabase.configure({ url: supabaseUrl, anonKey: supabaseKey });
    process.stderr.write("agent-runtime: Supabase configured\n");
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
  try {
    const response = await rt.sendMessage(message, userId, (type, data) => {
      emitNotification("stream_chunk", { requestId, agentId, type, ...data });
    });
    return { response };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`agent-runtime: send_message error: ${errMsg}\n`);
    if (err instanceof Error && err.stack) {
      process.stderr.write(`agent-runtime: ${err.stack}\n`);
    }
    throw err;
  }
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

router.register("configure_supabase", async (params) => {
  const url = params.supabaseUrl as string;
  const key = params.supabaseAnonKey as string;
  if (!url || !key) throw new Error("supabaseUrl and supabaseAnonKey are required");
  supabase.configure({ url, anonKey: key });
  return { status: "ok" };
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

// ─── New v2 RPC methods ───

router.register("list_conversations", async (params) => {
  const agentId = params.agentId as string;
  const limit = (params.limit as number | undefined) ?? 50;
  const offset = (params.offset as number | undefined) ?? 0;
  if (!agentId) throw new Error("agentId is required");
  const rt = await getOrLoadRuntime(agentId);
  const conversations = rt.getConversationStore().list(agentId, { limit, offset });
  return {
    conversations: conversations.map((c) => ({
      id: c.id,
      agentId: c.agentId,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c.messages.length,
    })),
  };
});

router.register("load_conversation", async (params) => {
  const conversationId = params.conversationId as string;
  if (!conversationId) throw new Error("conversationId is required");
  // Search across all loaded runtimes
  for (const rt of runtimes.values()) {
    const conv = rt.getConversationStore().load(conversationId);
    if (conv) {
      return { conversation: conv };
    }
  }
  return { conversation: null };
});

router.register("delete_conversation", async (params) => {
  const conversationId = params.conversationId as string;
  if (!conversationId) throw new Error("conversationId is required");
  for (const rt of runtimes.values()) {
    rt.getConversationStore().delete(conversationId);
  }
  return { status: "ok" };
});

router.register("get_memories", async (params) => {
  const agentId = params.agentId as string;
  const entityId = params.entityId as string;
  const entityType = (params.entityType as string) ?? "user";
  if (!agentId || !entityId) throw new Error("agentId and entityId are required");
  const rt = await getOrLoadRuntime(agentId);
  const memories = rt.getStructuredMemory().getMemoriesForEntity(agentId, entityId, entityType as EntityType);
  return {
    memories: memories.map((m) => ({
      id: m.id,
      entityId: m.entityId,
      entityType: m.entityType,
      category: m.category,
      content: m.content,
      confidence: m.confidence,
      createdAt: m.createdAt,
    })),
  };
});

router.register("get_usage_stats", async (params) => {
  const agentId = params.agentId as string | undefined;
  if (agentId) {
    const rt = await getOrLoadRuntime(agentId);
    return rt.getUsageStats();
  }
  // Return stats from first available runtime
  const first = runtimes.values().next();
  if (!first.done) {
    return first.value.getUsageStats();
  }
  return { daily: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, monthly: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, byAgent: [], byModel: [] };
});

router.register("get_cost_stats", async (params) => {
  const agentId = params.agentId as string | undefined;
  if (agentId) {
    const rt = await getOrLoadRuntime(agentId);
    return rt.getCostStats();
  }
  const first = runtimes.values().next();
  if (!first.done) {
    return first.value.getCostStats();
  }
  return { todayCost: 0, monthCost: 0, dailyLimit: 50, monthlyLimit: 500, withinBudget: true, totalConversations: 0 };
});

router.register("set_provider", async (params) => {
  const agentId = params.agentId as string;
  const providerId = params.providerId as string;
  if (!agentId || !providerId) throw new Error("agentId and providerId are required");
  const rt = await getOrLoadRuntime(agentId);
  rt.setProvider(providerId);
  return { status: "ok", provider: providerId };
});

router.register("list_providers", async (params) => {
  const agentId = params.agentId as string | undefined;
  if (agentId) {
    const rt = await getOrLoadRuntime(agentId);
    const providers = rt.getProviderRegistry().getAll();
    return {
      providers: providers.map((p) => ({
        name: p.name,
        displayName: p.displayName,
        available: true,
        models: p.listModels().map((m) => ({ id: m.id, name: m.name })),
      })),
    };
  }
  return { providers: [] };
});

router.register("get_working_memory", async (params) => {
  const agentId = params.agentId as string;
  if (!agentId) throw new Error("agentId is required");
  const rt = await getOrLoadRuntime(agentId);
  const wm = rt.getWorkingMemory();
  return { entries: wm?.list() ?? {} };
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
