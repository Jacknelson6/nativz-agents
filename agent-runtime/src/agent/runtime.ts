import type { MessageParam, ContentBlock } from "@anthropic-ai/sdk/resources/messages.js";
import { ClaudeClient, type LlmResponse, type StreamCallbacks } from "../llm/client.js";
import { selectModel, classifyComplexity, SmartRouter, type ModelConfig, type RoutingDecision } from "../llm/router.js";
import { ProviderRegistry } from "../llm/provider-registry.js";
import { CostTracker as LlmCostTracker } from "../llm/cost-tracker.js";
import { AnthropicProvider } from "../llm/providers/anthropic.js";
import { OpenAIProvider } from "../llm/providers/openai.js";
import { GeminiProvider } from "../llm/providers/gemini.js";
import { OllamaProvider } from "../llm/providers/ollama.js";
import { OpenRouterProvider } from "../llm/providers/openrouter.js";
import type { UnifiedLlmRequest, UnifiedLlmResponse, UnifiedMessage, UnifiedToolDefinition, UnifiedStreamCallbacks, UnifiedContentBlock } from "../llm/providers/types.js";
import { SkillRegistry } from "../skills/registry.js";
import { SkillExecutor } from "../skills/executor.js";
import { builtinSkills } from "../skills/builtin/index.js";
import { ToolSelector } from "../skills/selector.js";
import { KnowledgeSearch } from "../knowledge/search.js";
import { loadKnowledgeDirectory } from "../knowledge/loader.js";
import { MemoryStore } from "../memory/store.js";
import { StructuredMemoryStore } from "../memory/structured.js";
import { WorkingMemory } from "../memory/working.js";
import { ConversationStore, type ConversationMessage } from "../memory/conversations.js";
import { extractFacts } from "../memory/extractor.js";
import { ConversationSummarizer } from "../memory/summarizer.js";
import { McpRegistry } from "../mcp/registry.js";
import { McpServerManager } from "../mcp/manager.js";
import { BrowserManager } from "../browser/manager.js";
import { CheckpointManager, type CheckpointState } from "./checkpoint.js";
import { type AgentManifest, loadManifest } from "./loader.js";
import { buildContext } from "./context.js";
import { ContextManager } from "../context/manager.js";
import { SkillLoader } from "../context/skill-loader.js";
import { TurnScorer, type ToolCallInfo } from "../eval/scorer.js";
import { EvalTracker } from "../eval/tracker.js";
import { UsageTracker } from "../telemetry/usage.js";
import { CostTracker } from "../telemetry/cost.js";
import { LatencyTracker } from "../telemetry/latency.js";
import * as path from "node:path";
import * as fs from "node:fs";

const MAX_TOOL_LOOPS = 20;

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  toolCalls?: Array<{ name: string; input: Record<string, unknown>; result: string }>;
}

export interface AgentRuntimeConfig {
  apiKey?: string;
  dataDir?: string;
}

export class AgentRuntime {
  // Legacy systems (backward compat)
  private client: ClaudeClient;
  private skillRegistry: SkillRegistry;
  private skillExecutor: SkillExecutor;
  private knowledgeSearch: KnowledgeSearch | null = null;
  private memoryStore: MemoryStore;
  private summarizer: ConversationSummarizer;
  private mcpRegistry: McpRegistry;

  // v2 systems
  private providerRegistry: ProviderRegistry;
  private llmCostTracker: LlmCostTracker;
  private smartRouter: SmartRouter;
  private structuredMemory: StructuredMemoryStore;
  private workingMemory: WorkingMemory | null = null;
  private conversationStore: ConversationStore;
  private checkpointManager: CheckpointManager;
  private mcpManager: McpServerManager;
  private contextManager: ContextManager;
  private skillLoader: SkillLoader;
  private toolSelector: ToolSelector;
  private turnScorer: TurnScorer;
  private evalTracker: EvalTracker;
  private usageTracker: UsageTracker;
  private costTracker: CostTracker;
  private latencyTracker: LatencyTracker;

  private manifest: AgentManifest | null = null;
  private conversationHistory: MessageParam[] = [];
  private conversationSummary = "";
  private agentMessages: AgentMessage[] = [];
  private conversationId: string | null = null;
  private turnIndex = 0;
  private activeProviderId: string | null = null;
  private dataDir: string;

  constructor(config?: string | AgentRuntimeConfig) {
    const apiKey = typeof config === "string" ? config : config?.apiKey;
    this.dataDir = (typeof config === "object" ? config?.dataDir : undefined) ?? path.join(process.cwd(), "data");

    // Legacy
    this.client = new ClaudeClient(apiKey);
    this.skillRegistry = new SkillRegistry();
    this.skillExecutor = new SkillExecutor(this.skillRegistry);
    this.memoryStore = new MemoryStore(path.join(this.dataDir, "memory.db"));
    this.summarizer = new ConversationSummarizer(this.client);
    this.mcpRegistry = new McpRegistry();

    // v2 systems — register all available providers
    this.providerRegistry = new ProviderRegistry();
    this.llmCostTracker = new LlmCostTracker();

    // Always register Anthropic (we have it as the legacy fallback)
    this.providerRegistry.register(new AnthropicProvider({ apiKey }));

    // Register other providers if their API keys are available
    if (process.env.OPENAI_API_KEY) {
      this.providerRegistry.register(new OpenAIProvider());
    }
    if (process.env.GOOGLE_API_KEY) {
      this.providerRegistry.register(new GeminiProvider());
    }
    // Ollama is local — always register, health check will determine availability
    this.providerRegistry.register(new OllamaProvider());
    if (process.env.OPENROUTER_API_KEY) {
      this.providerRegistry.register(new OpenRouterProvider());
    }

    this.smartRouter = new SmartRouter(this.providerRegistry, this.llmCostTracker);
    this.structuredMemory = new StructuredMemoryStore(path.join(this.dataDir, "structured_memory.db"));
    this.conversationStore = new ConversationStore(path.join(this.dataDir, "conversations.db"));
    this.checkpointManager = new CheckpointManager(path.join(this.dataDir, "checkpoints.db"));
    this.mcpManager = new McpServerManager();
    this.contextManager = new ContextManager();
    this.skillLoader = new SkillLoader();
    this.toolSelector = new ToolSelector();
    this.turnScorer = new TurnScorer();
    this.evalTracker = new EvalTracker(path.join(this.dataDir, "eval.db"));
    this.usageTracker = new UsageTracker(path.join(this.dataDir, "usage.db"));
    this.costTracker = new CostTracker();
    this.latencyTracker = new LatencyTracker(path.join(this.dataDir, "latency.db"));

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
    const agentId = this.manifest.id;

    // Initialize knowledge search with agent-specific data
    this.knowledgeSearch = new KnowledgeSearch(this.dataDir, agentId);

    // Load knowledge
    for (const knowledgePath of this.manifest.knowledge) {
      const fullPath = path.resolve(agentDir, knowledgePath);
      const chunks = await loadKnowledgeDirectory(fullPath);
      await this.knowledgeSearch.addChunks(chunks);
    }

    // Connect MCP servers via manager (with auto-restart)
    for (const server of this.manifest.mcpServers) {
      try {
        await this.mcpManager.startServer(server.name, {
          command: server.command,
          args: server.args,
          env: server.env,
        });
      } catch (err) {
        console.error(`Failed to start MCP server ${server.name}:`, err);
      }
    }

    // Also connect via legacy registry for backward compat
    for (const server of this.manifest.mcpServers) {
      try {
        await this.mcpRegistry.connectServer(server.name, {
          command: server.command,
          args: server.args,
          env: server.env,
        });
      } catch (err) {
        // Already logged above
      }
    }

    // Merge MCP tools into skill registry
    for (const skill of this.mcpRegistry.toSkillDefinitions()) {
      this.skillRegistry.register(skill);
    }

    // Load skill files from agent directory
    const skillsDir = path.resolve(agentDir, "skills");
    if (fs.existsSync(skillsDir)) {
      await this.skillLoader.loadDirectory(skillsDir);
    }
    // Also try loading SKILL.md from agent root
    await this.skillLoader.loadDirectory(agentDir);

    // Apply context budget from manifest if present
    if (this.manifest.context?.budgetAllocation) {
      this.contextManager = new ContextManager(this.manifest.context.budgetAllocation);
    }

    return this.manifest;
  }

  /**
   * Start or resume a conversation.
   */
  startConversation(conversationId?: string): string {
    if (!this.manifest) throw new Error("No agent loaded");

    if (conversationId) {
      const existing = this.conversationStore.load(conversationId);
      if (existing) {
        this.conversationId = existing.id;
        this.conversationHistory = existing.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
        this.turnIndex = existing.messages.length;
        return existing.id;
      }
    }

    const conv = this.conversationStore.create(this.manifest.id);
    this.conversationId = conv.id;
    this.conversationHistory = [];
    this.turnIndex = 0;

    // Initialize working memory for this conversation
    this.workingMemory = new WorkingMemory(this.manifest.id, conv.id, {
      dbPath: path.join(this.dataDir, "working_memory.db"),
      maxTokens: this.manifest.memory?.workingMemorySize ?? 4096,
    });

    return conv.id;
  }

  /**
   * Hot-swap the active LLM provider.
   */
  setProvider(providerId: string): void {
    if (!this.providerRegistry.has(providerId)) {
      throw new Error(`Provider not found: ${providerId}`);
    }
    this.activeProviderId = providerId;
  }

  getProviderRegistry(): ProviderRegistry {
    return this.providerRegistry;
  }

  async sendMessage(
    userMessage: string,
    userId = "default",
    onStreamNotify?: (type: string, data: Record<string, unknown>) => void
  ): Promise<string> {
    if (!this.manifest) throw new Error("No agent loaded");

    // Auto-start conversation if none active
    if (!this.conversationId) {
      this.startConversation();
    }

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

    // Get working memory serialization
    const workingMemoryXml = this.workingMemory?.serialize() ?? "";

    // Inject matched skills
    const skillContent = this.skillLoader.injectSkills(userMessage);

    // Build context (using legacy buildContext for backward compat)
    const ctx = await buildContext({
      manifest: this.manifest,
      userMessage,
      conversationHistory: this.conversationHistory,
      knowledgeSearch: this.knowledgeSearch ?? undefined,
      memoryStore: this.memoryStore,
      userId,
      conversationSummary: this.conversationSummary,
      workingMemoryXml,
      skillContent,
      contextManager: this.contextManager,
    });

    // Select model via smart router (multi-provider) with fallback to legacy
    const allTools = this.skillRegistry.list();
    const selectedTools = this.toolSelector.selectTools(userMessage, allTools);
    const tools = this.skillRegistry.toClaudeTools(
      selectedTools.map((t) => t.name)
    );

    const routingDecision = this.smartRouter.route(
      userMessage,
      this.conversationHistory.length,
      tools.length,
      this.manifest.id
    );

    // If user has hot-swapped a provider, override the router's decision
    const activeProvider = this.activeProviderId ?? routingDecision.provider;
    const activeModel = this.activeProviderId
      ? routingDecision.model // keep router's model choice even with override
      : routingDecision.model;

    // Convert tools to unified format for multi-provider calls
    const unifiedTools: UnifiedToolDefinition[] | undefined = tools.length > 0
      ? tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: {
            type: "object" as const,
            properties: Object.fromEntries(
              Object.entries((t.input_schema.properties ?? {}) as Record<string, Record<string, unknown>>).map(([k, v]) => [k, {
                type: (v.type as string) ?? "string",
                description: (v.description as string) ?? undefined,
              }])
            ),
            required: t.input_schema.required as string[] | undefined,
          },
        }))
      : undefined;

    // Agent loop
    let messages = [...ctx.messages];
    let loopCount = 0;
    const toolCalls: AgentMessage["toolCalls"] = [];

    while (loopCount < MAX_TOOL_LOOPS) {
      loopCount++;
      const callStartTime = Date.now();

      // Build unified request
      const unifiedMessages: UnifiedMessage[] = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      }));

      const unifiedRequest: UnifiedLlmRequest = {
        model: activeModel,
        system: ctx.system,
        messages: unifiedMessages,
        tools: unifiedTools,
        maxTokens: this.manifest.guardrails.maxTokensPerTurn,
      };

      const streamCallbacks: UnifiedStreamCallbacks | undefined = onStreamNotify
        ? {
            onTextDelta: (text) => onStreamNotify("text_delta", { text }),
            onToolUseStart: (name, id) => onStreamNotify("tool_use_start", { name, toolUseId: id }),
            onMessageDone: (fullText) => onStreamNotify("message_done", { fullText }),
          }
        : undefined;

      // Route through provider registry with fallback chain
      const useStream = !!onStreamNotify;
      const response = await this.providerRegistry.callWithFallback(
        unifiedRequest,
        activeProvider,
        streamCallbacks,
        useStream
      );

      const latencyMs = response.latencyMs;

      // Record telemetry with actual provider/model used
      this.usageTracker.recordUsage({
        conversationId: this.conversationId ?? "unknown",
        agentId: this.manifest.id,
        provider: response.provider,
        model: response.model,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
      });

      this.latencyTracker.record({
        provider: response.provider,
        model: response.model,
        timeToFirstTokenMs: latencyMs * 0.3,
        totalTimeMs: latencyMs,
      });

      this.llmCostTracker.recordUsage(
        this.conversationId ?? "unknown",
        response.provider,
        response.model,
        response.usage.inputTokens,
        response.usage.outputTokens
      );

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
        this.turnIndex++;

        // Persist conversation
        this.persistConversation();

        // Score this turn
        const toolCallInfos: ToolCallInfo[] = (toolCalls ?? []).map((tc) => ({
          name: tc.name,
          input: tc.input,
          result: tc.result,
        }));
        const score = this.turnScorer.scoreTurn(userMessage, text, toolCallInfos);
        this.evalTracker.recordTurn(
          this.conversationId ?? "unknown",
          this.turnIndex,
          score,
          this.manifest.id,
          response.model
        );

        // Extract facts asynchronously (fire-and-forget with fast model)
        if (this.manifest.memory?.extractFacts !== false) {
          this.extractFactsAsync(userMessage, text, userId).catch((err) => {
            console.error("Fact extraction failed:", err);
          });
        }

        return text;
      }

      // Execute tools — convert unified content back to Anthropic ContentBlock shape
      // for message history (the conversation protocol uses Anthropic format)
      messages.push({ role: "assistant", content: response.content as unknown as ContentBlock[] });

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

        // Record tool usage for selector
        this.toolSelector.recordUsage(block.name);
      }

      messages.push({ role: "user", content: toolResults });

      // Checkpoint after tool execution
      this.saveCheckpoint(loopCount, toolCalls);
    }

    const fallback = "I've reached the maximum number of tool calls. Here's what I've done so far.";
    this.conversationHistory.push({ role: "assistant", content: fallback });
    this.persistConversation();
    return fallback;
  }

  private async extractFactsAsync(userMessage: string, assistantResponse: string, userId: string): Promise<void> {
    if (!this.manifest) return;

    const recentMessages = [
      { role: "user", content: userMessage },
      { role: "assistant", content: assistantResponse },
    ];

    const llmFn = async (prompt: string): Promise<string> => {
      const response = await this.client.call({
        model: this.manifest!.model.fast,
        system: "You are a fact extraction system.",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 2000,
      });
      const textBlocks = response.content.filter((b) => b.type === "text");
      return textBlocks.map((b) => ("text" in b ? b.text : "")).join("");
    };

    const facts = await extractFacts(recentMessages, llmFn, this.manifest.id);
    for (const fact of facts) {
      this.structuredMemory.addMemory(fact);
    }
  }

  private persistConversation(): void {
    if (!this.conversationId) return;
    const messages: ConversationMessage[] = this.conversationHistory.map((m) => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    }));
    this.conversationStore.save(this.conversationId, messages);
  }

  private saveCheckpoint(loopIteration: number, toolCalls: NonNullable<AgentMessage["toolCalls"]>): void {
    if (!this.conversationId) return;

    const toolCallResults: Record<string, string> = {};
    for (const tc of toolCalls) {
      toolCallResults[tc.name] = tc.result;
    }

    const wmEntries = this.workingMemory?.list() ?? {};

    const state: CheckpointState = {
      conversationHistory: this.conversationHistory.map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      })),
      toolCallResults,
      workingMemory: wmEntries,
      loopIteration,
    };

    this.checkpointManager.save(this.conversationId, state);
  }

  // ─── Public accessors ───

  getHistory(): AgentMessage[] {
    return this.agentMessages;
  }

  getConversationStore(): ConversationStore {
    return this.conversationStore;
  }

  getStructuredMemory(): StructuredMemoryStore {
    return this.structuredMemory;
  }

  getWorkingMemory(): WorkingMemory | null {
    return this.workingMemory;
  }

  getUsageStats(): {
    daily: { inputTokens: number; outputTokens: number; totalTokens: number };
    monthly: { inputTokens: number; outputTokens: number; totalTokens: number };
    byAgent: Array<{ group: string; inputTokens: number; outputTokens: number; totalTokens: number }>;
    byModel: Array<{ group: string; inputTokens: number; outputTokens: number; totalTokens: number }>;
  } {
    return {
      daily: this.usageTracker.getDailyUsage(),
      monthly: this.usageTracker.getMonthlyUsage(),
      byAgent: this.usageTracker.getUsageByAgent(),
      byModel: this.usageTracker.getUsageByModel(),
    };
  }

  getCostStats(): {
    todayCost: number;
    monthCost: number;
    dailyLimit: number;
    monthlyLimit: number;
    withinBudget: boolean;
    totalConversations: number;
  } {
    return this.llmCostTracker.getSummary();
  }

  async shutdown(): Promise<void> {
    await this.mcpRegistry.disconnectAll();
    await this.mcpManager.shutdownAll();
    await BrowserManager.getInstance().close();
    this.memoryStore.close();
    this.structuredMemory.close();
    this.workingMemory?.close();
    this.conversationStore.close();
    this.checkpointManager.close();
    this.knowledgeSearch?.close();
    this.evalTracker.close();
    this.usageTracker.close();
    this.latencyTracker.close();
  }
}
