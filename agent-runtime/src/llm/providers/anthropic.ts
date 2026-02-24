import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, Tool } from "@anthropic-ai/sdk/resources/messages.js";
import type {
  LlmProvider,
  ProviderConfig,
  ProviderHealth,
  ModelInfo,
  UnifiedLlmRequest,
  UnifiedLlmResponse,
  UnifiedStreamCallbacks,
  UnifiedContentBlock,
  UnifiedToolDefinition,
  UnifiedMessage,
} from "./types.js";

const ANTHROPIC_MODELS: ModelInfo[] = [
  {
    id: "claude-opus-4-20250514",
    name: "Claude Opus 4",
    contextWindow: 200000,
    maxOutputTokens: 32768,
    inputCostPer1M: 15,
    outputCostPer1M: 75,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    contextWindow: 200000,
    maxOutputTokens: 16384,
    inputCostPer1M: 3,
    outputCostPer1M: 15,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: "claude-haiku-4-5-20241022",
    name: "Claude Haiku 4.5",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputCostPer1M: 0.8,
    outputCostPer1M: 4,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
];

function toAnthropicMessages(messages: UnifiedMessage[]): MessageParam[] {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: typeof m.content === "string" ? m.content : m.content.map((p) => {
        if (p.type === "text") return { type: "text" as const, text: p.text };
        return { type: "text" as const, text: "[image]" };
      }),
    }));
}

function toAnthropicTools(tools: UnifiedToolDefinition[]): Tool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: {
      type: "object" as const,
      properties: t.inputSchema.properties as Record<string, unknown>,
      required: t.inputSchema.required,
    },
  }));
}

function toUnifiedContent(content: Anthropic.ContentBlock[]): UnifiedContentBlock[] {
  return content.map((block): UnifiedContentBlock => {
    if (block.type === "text") {
      return { type: "text", text: block.text };
    }
    if (block.type === "tool_use") {
      return {
        type: "tool_use",
        id: block.id,
        name: block.name,
        input: block.input as Record<string, unknown>,
      };
    }
    return { type: "text", text: "" };
  });
}

export class AnthropicProvider implements LlmProvider {
  readonly name = "anthropic";
  readonly displayName = "Anthropic Claude";
  private client: Anthropic;

  constructor(config?: ProviderConfig) {
    this.client = new Anthropic({
      apiKey: config?.apiKey ?? process.env.ANTHROPIC_API_KEY,
      maxRetries: config?.maxRetries ?? 2,
      timeout: config?.timeoutMs ?? 120000,
    });
  }

  async call(request: UnifiedLlmRequest): Promise<UnifiedLlmResponse> {
    const start = Date.now();
    const messages = toAnthropicMessages(request.messages);
    const tools = request.tools ? toAnthropicTools(request.tools) : undefined;

    const response = await this.client.messages.create({
      model: request.model,
      max_tokens: request.maxTokens ?? 4096,
      system: request.system,
      messages,
      tools,
      temperature: request.temperature,
      stop_sequences: request.stopSequences,
    });

    return {
      content: toUnifiedContent(response.content),
      stopReason: response.stop_reason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      model: response.model,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  async streamCall(
    request: UnifiedLlmRequest,
    callbacks?: UnifiedStreamCallbacks
  ): Promise<UnifiedLlmResponse> {
    const start = Date.now();
    const messages = toAnthropicMessages(request.messages);
    const tools = request.tools ? toAnthropicTools(request.tools) : undefined;

    try {
      const stream = this.client.messages.stream({
        model: request.model,
        max_tokens: request.maxTokens ?? 4096,
        system: request.system,
        messages,
        tools,
        temperature: request.temperature,
        stop_sequences: request.stopSequences,
      });

      stream.on("text", (text) => callbacks?.onTextDelta?.(text));
      stream.on("contentBlock", (block) => {
        if (block.type === "tool_use") {
          callbacks?.onToolUseStart?.(block.name, block.id);
        }
      });

      const finalMessage = await stream.finalMessage();
      const fullText = finalMessage.content
        .filter((b) => b.type === "text")
        .map((b) => ("text" in b ? b.text : ""))
        .join("");
      callbacks?.onMessageDone?.(fullText);

      return {
        content: toUnifiedContent(finalMessage.content),
        stopReason: finalMessage.stop_reason,
        usage: {
          inputTokens: finalMessage.usage.input_tokens,
          outputTokens: finalMessage.usage.output_tokens,
        },
        model: finalMessage.model,
        provider: this.name,
        latencyMs: Date.now() - start,
      };
    } catch {
      return this.call(request);
    }
  }

  async countTokens(text: string, _model?: string): Promise<number> {
    // Approximate: ~4 chars per token for Claude
    return Math.ceil(text.length / 4);
  }

  listModels(): ModelInfo[] {
    return ANTHROPIC_MODELS;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.available;
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      await this.client.messages.create({
        model: "claude-haiku-4-5-20241022",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      });
      return { available: true, latencyMs: Date.now() - start, lastChecked: Date.now() };
    } catch (err) {
      return {
        available: false,
        lastChecked: Date.now(),
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
