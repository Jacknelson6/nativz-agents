import "dotenv/config";
import { RpcRouter } from "./rpc/router.js";
import { RpcServer } from "./rpc/server.js";
import { AgentRuntime } from "./agent/runtime.js";
import { listAgents } from "./agent/loader.js";
import type { EntityType } from "./memory/structured.js";
import { supabase } from "./integrations/supabase.js";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

// Handle both ESM (tsx) and compiled binary (bun) contexts
let __dirname_resolved: string;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname_resolved = path.dirname(__filename);
} catch {
  __dirname_resolved = process.cwd();
}

const router = new RpcRouter();
let agentsDir = path.resolve(__dirname_resolved, "../../agents");
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
  const requestId = (params.requestId as string | undefined) ?? crypto.randomUUID();
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

  // If no agentId, gather conversations across all loaded runtimes
  if (!agentId) {
    const allConvs: Array<{ id: string; agentId: string; title: string; createdAt: string; updatedAt: string; messageCount: number }> = [];
    for (const [aid, rt] of runtimes.entries()) {
      const conversations = rt.getConversationStore().list(aid, { limit, offset });
      for (const c of conversations) {
        allConvs.push({
          id: c.id,
          agentId: c.agentId,
          title: c.title,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          messageCount: c.messages.length,
        });
      }
    }
    allConvs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return { conversations: allConvs.slice(offset, offset + limit) };
  }

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

router.register("rename_conversation", async (params) => {
  const conversationId = params.conversationId as string;
  const title = params.title as string;
  if (!conversationId || !title) throw new Error("conversationId and title required");
  for (const rt of runtimes.values()) {
    const conv = rt.getConversationStore().load(conversationId);
    if (conv) {
      rt.getConversationStore().updateTitle(conversationId, title);
      return { status: "ok" };
    }
  }
  return { status: "not_found" };
});

router.register("get_memories", async (params) => {
  const agentId = params.agentId as string;
  const entityId = (params.entityId as string) || "";
  const entityType = (params.entityType as string) ?? "user";
  if (!agentId) throw new Error("agentId is required");
  const rt = await getOrLoadRuntime(agentId);
  // If no entityId provided, return ALL memories for the agent
  const memories = entityId
    ? rt.getStructuredMemory().getMemoriesForEntity(agentId, entityId, entityType as EntityType)
    : rt.getStructuredMemory().getAllMemories(agentId);
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
  const force = (params.force as boolean | undefined) ?? false;
  if (agentId) {
    const rt = await getOrLoadRuntime(agentId);
    const registry = rt.getProviderRegistry();
    const providers = registry.getAll();

    // Only run health checks if forced or no cached data exists
    const needsCheck = force || providers.some((p) => !registry.getCachedHealth(p.name));
    if (needsCheck) {
      await registry.healthCheckAll(force).catch(() => {});
    }

    return {
      providers: providers.map((p) => {
        const health = registry.getCachedHealth(p.name);
        const models = p.listModels();
        return {
          id: p.name,
          name: p.displayName,
          models: models.map((m) => ({
            id: m.id,
            name: m.name,
            contextWindow: m.contextWindow,
            costPerInputToken: m.inputCostPer1M / 1_000_000,
            costPerOutputToken: m.outputCostPer1M / 1_000_000,
          })),
          health: {
            status: health?.available ? "healthy" : "down",
            latencyMs: health?.latencyMs ?? 0,
            lastChecked: health?.lastChecked ?? 0,
          },
          isSubscription: false,
        };
      }),
    };
  }
  return { providers: [] };
});

router.register("update_memory", async (params) => {
  const agentId = params.agentId as string;
  const memoryId = params.memoryId as string;
  const content = params.content as string;
  const confidence = params.confidence as number | undefined;
  if (!agentId || !memoryId || !content) throw new Error("agentId, memoryId, and content required");
  const rt = await getOrLoadRuntime(agentId);
  rt.getStructuredMemory().updateMemory(memoryId, content, confidence);
  return { status: "ok" };
});

router.register("delete_memory", async (params) => {
  const agentId = params.agentId as string;
  const memoryId = params.memoryId as string;
  if (!agentId || !memoryId) throw new Error("agentId and memoryId required");
  const rt = await getOrLoadRuntime(agentId);
  rt.getStructuredMemory().deleteMemory(memoryId);
  return { status: "ok" };
});

router.register("get_working_memory", async (params) => {
  const agentId = params.agentId as string;
  if (!agentId) throw new Error("agentId is required");
  const rt = await getOrLoadRuntime(agentId);
  const wm = rt.getWorkingMemory();
  return { entries: wm?.list() ?? {} };
});

router.register("list_knowledge_files", async (params) => {
  const agentId = params.agentId as string;
  if (!agentId) throw new Error("agentId is required");
  const rt = await getOrLoadRuntime(agentId);
  const manifest = rt.getManifest();
  if (!manifest) return { files: [] };

  const agentDir = path.join(agentsDir, agentId);
  const knowledgeDir = path.join(agentDir, "knowledge");

  const files: Array<{ name: string; path: string; sizeBytes: number; modifiedAt: string }> = [];

  try {
    const entries = fs.readdirSync(knowledgeDir);
    for (const entry of entries) {
      if (!entry.endsWith('.md')) continue;
      const filePath = path.join(knowledgeDir, entry);
      const stat = fs.statSync(filePath);
      files.push({
        name: entry.replace(/\.md$/, '').replace(/[-_]/g, ' '),
        path: entry,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      });
    }
  } catch {
    // knowledge dir may not exist
  }

  return { files };
});

router.register("read_knowledge_file", async (params) => {
  const agentId = params.agentId as string;
  const filePath = params.filePath as string;
  if (!agentId || !filePath) throw new Error("agentId and filePath required");

  // Prevent path traversal
  const safeName = path.basename(filePath);
  const fullPath = path.join(agentsDir, agentId, "knowledge", safeName);

  try {
    const content = fs.readFileSync(fullPath, "utf-8");
    return { content };
  } catch {
    return { content: null, error: "File not found" };
  }
});

router.register("get_system_prompt", async (params) => {
  const agentId = params.agentId as string;
  if (!agentId) throw new Error("agentId required");
  const rt = await getOrLoadRuntime(agentId);
  const manifest = rt.getManifest();

  // Check for custom prompt file
  const customPath = path.join(agentsDir, agentId, "custom_prompts", "system.txt");
  try {
    const custom = fs.readFileSync(customPath, "utf-8");
    return { prompt: custom, isCustom: true, defaultPrompt: manifest?.systemPrompt ?? "" };
  } catch {
    return { prompt: manifest?.systemPrompt ?? "", isCustom: false, defaultPrompt: manifest?.systemPrompt ?? "" };
  }
});

router.register("set_system_prompt", async (params) => {
  const agentId = params.agentId as string;
  const prompt = params.prompt as string;
  if (!agentId || prompt === undefined) throw new Error("agentId and prompt required");

  const customDir = path.join(agentsDir, agentId, "custom_prompts");
  fs.mkdirSync(customDir, { recursive: true });
  fs.writeFileSync(path.join(customDir, "system.txt"), prompt, "utf-8");

  return { status: "ok" };
});

router.register("ping", async () => {
  return { status: "ok", uptime: Math.floor(process.uptime()) };
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

// Startup health check
const hasKeys = !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENROUTER_API_KEY);
if (!hasKeys) {
  process.stderr.write("agent-runtime: WARNING - No LLM API keys found in environment. Please configure them in the app.\n");
}

// Log to stderr so it doesn't interfere with JSON-RPC on stdout
process.stderr.write("agent-runtime: RPC server started\n");
