import type { MessageParam, ContentBlock } from "@anthropic-ai/sdk/resources/messages.js";
import { ClaudeClient, type LlmResponse } from "../llm/client.js";
import { selectModel, classifyComplexity, type ModelConfig } from "../llm/router.js";
import { SkillRegistry } from "../skills/registry.js";
import { SkillExecutor } from "../skills/executor.js";
import { builtinSkills } from "../skills/builtin/index.js";
import { KnowledgeSearch } from "../knowledge/search.js";
import { loadKnowledgeDirectory } from "../knowledge/loader.js";
import { MemoryStore } from "../memory/store.js";
import { ConversationSummarizer } from "../memory/summarizer.js";
import { McpRegistry } from "../mcp/registry.js";
import { BrowserManager } from "../browser/manager.js";
import { type AgentManifest, loadManifest } from "./loader.js";
import { buildContext } from "./context.js";
import * as path from "node:path";

const MAX_TOOL_LOOPS = 20;

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  toolCalls?: Array<{ name: string; input: Record<string, unknown>; result: string }>;
}

export class AgentRuntime {
  private client: ClaudeClient;
  private skillRegistry: SkillRegistry;
  private skillExecutor: SkillExecutor;
  private knowledgeSearch: KnowledgeSearch;
  private memoryStore: MemoryStore;
  private summarizer: ConversationSummarizer;
  private mcpRegistry: McpRegistry;
  private manifest: AgentManifest | null = null;
  private conversationHistory: MessageParam[] = [];
  private conversationSummary = "";
  private agentMessages: AgentMessage[] = [];

  constructor(apiKey?: string) {
    this.client = new ClaudeClient(apiKey);
    this.skillRegistry = new SkillRegistry();
    this.skillExecutor = new SkillExecutor(this.skillRegistry);
    this.knowledgeSearch = new KnowledgeSearch();
    this.memoryStore = new MemoryStore();
    this.summarizer = new ConversationSummarizer(this.client);
    this.mcpRegistry = new McpRegistry();

    // Register builtin skills
    for (const skill of builtinSkills) {
      this.skillRegistry.register(skill);
    }
  }

  getManifest(): AgentManifest | null {
    return this.manifest;
  }

  async loadAgent(manifestPath: string): Promise<AgentManifest> {
    this.manifest = await loadManifest(manifestPath);
    const agentDir = path.dirname(manifestPath);

    // Load knowledge
    for (const knowledgePath of this.manifest.knowledge) {
      const fullPath = path.resolve(agentDir, knowledgePath);
      const chunks = await loadKnowledgeDirectory(fullPath);
      this.knowledgeSearch.addChunks(chunks);
    }

    // Connect MCP servers
    for (const server of this.manifest.mcpServers) {
      try {
        await this.mcpRegistry.connectServer(server.name, {
          command: server.command,
          args: server.args,
          env: server.env,
        });
      } catch (err) {
        console.error(`Failed to connect MCP server ${server.name}:`, err);
      }
    }

    // Merge MCP tools into skill registry
    for (const skill of this.mcpRegistry.toSkillDefinitions()) {
      this.skillRegistry.register(skill);
    }

    return this.manifest;
  }

  async sendMessage(
    userMessage: string,
    userId = "default",
    onToken?: (token: string) => void
  ): Promise<string> {
    if (!this.manifest) throw new Error("No agent loaded");

    // Summarize if conversation is long
    if (this.summarizer.shouldSummarize(this.conversationHistory)) {
      const { summary, retainedMessages } = await this.summarizer.summarize(
        this.conversationHistory
      );
      this.conversationSummary = summary;
      this.conversationHistory = retainedMessages;
    }

    // Add user message
    this.conversationHistory.push({ role: "user", content: userMessage });

    // Build context
    const ctx = buildContext({
      manifest: this.manifest,
      userMessage,
      conversationHistory: this.conversationHistory,
      knowledgeSearch: this.knowledgeSearch,
      memoryStore: this.memoryStore,
      userId,
      conversationSummary: this.conversationSummary,
    });

    // Select model
    const complexity = classifyComplexity(userMessage);
    const modelConfig: ModelConfig = this.manifest.model;
    const model = selectModel(complexity, modelConfig);

    // Get tools
    const tools = this.skillRegistry.toClaudeTools(this.manifest.skills);

    // Agent loop
    let messages = [...ctx.messages];
    let loopCount = 0;
    const toolCalls: AgentMessage["toolCalls"] = [];

    while (loopCount < MAX_TOOL_LOOPS) {
      loopCount++;

      const response = await this.client.call({
        model,
        system: ctx.system,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        maxTokens: this.manifest.guardrails.maxTokensPerTurn,
      });

      // Check for tool use
      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
      const textBlocks = response.content.filter((b) => b.type === "text");

      if (toolUseBlocks.length === 0 || response.stopReason !== "tool_use") {
        // Final text response
        const text = textBlocks
          .map((b) => ("text" in b ? b.text : ""))
          .join("")
          .trim();

        this.conversationHistory.push({ role: "assistant", content: text });
        this.agentMessages.push({
          role: "assistant",
          content: text,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        });
        return text;
      }

      // Execute tools
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Array<{
        type: "tool_result";
        tool_use_id: string;
        content: string;
      }> = [];

      for (const block of toolUseBlocks) {
        if (block.type !== "tool_use") continue;
        const result = await this.skillExecutor.execute(
          block.name,
          block.input as Record<string, unknown>
        );
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
        toolCalls.push({
          name: block.name,
          input: block.input as Record<string, unknown>,
          result,
        });
      }

      messages.push({ role: "user", content: toolResults });
    }

    const fallback = "I've reached the maximum number of tool calls. Here's what I've done so far.";
    this.conversationHistory.push({ role: "assistant", content: fallback });
    return fallback;
  }

  getHistory(): AgentMessage[] {
    return this.agentMessages;
  }

  async shutdown(): Promise<void> {
    await this.mcpRegistry.disconnectAll();
    await BrowserManager.getInstance().close();
    this.memoryStore.close();
  }
}
