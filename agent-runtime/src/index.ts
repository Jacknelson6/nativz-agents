import { RpcRouter } from "./rpc/router.js";
import { RpcServer } from "./rpc/server.js";
import { AgentRuntime } from "./agent/runtime.js";
import { listAgents } from "./agent/loader.js";
import * as path from "node:path";

const router = new RpcRouter();
const runtime = new AgentRuntime();
const agentsDir = path.resolve(process.cwd(), "agents");

router.register("initialize", async (params) => {
  const agentId = params.agentId as string | undefined;
  if (!agentId) {
    return { status: "ready", message: "Runtime initialized. No agent loaded." };
  }
  const manifestPath = path.join(agentsDir, agentId, "manifest.json");
  const manifest = await runtime.loadAgent(manifestPath);
  return {
    status: "ready",
    agent: { id: manifest.id, name: manifest.name, description: manifest.description },
  };
});

router.register("send_message", async (params) => {
  const message = params.message as string;
  const userId = (params.userId as string) ?? "default";
  if (!message) throw new Error("message is required");
  const response = await runtime.sendMessage(message, userId);
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

router.register("get_history", async () => {
  return { messages: runtime.getHistory() };
});

router.register("shutdown", async () => {
  await runtime.shutdown();
  setTimeout(() => process.exit(0), 100);
  return { status: "shutting_down" };
});

// Start the server
const server = new RpcServer(router);
server.start();

// Log to stderr so it doesn't interfere with JSON-RPC on stdout
process.stderr.write("agent-runtime: RPC server started\n");
