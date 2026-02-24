import OpenAI from "openai";
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

const OPENAI_MODELS: ModelInfo[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputCostPer1M: 2.5,
    outputCostPer1M: 10,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: "o3-mini",
    name: "o3-mini",
    contextWindow: 200000,
    maxOutputTokens: 100000,
    inputCostPer1M: 1.1,
    outputCostPer1M: 4.4,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: false,
  },
];

type OpenAIMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;
type OpenAIChatTool = OpenAI.Chat.Completions.ChatCompletionTool;

function toOpenAIMessages(system: string, messages: UnifiedMessage[]): OpenAIMessage[] {
  const result: OpenAIMessage[] = [{ role: "system", content: system }];
  for (const m of messages) {
    if (m.role === "system") continue;
    const content = typeof m.content === "string"
      ? m.content
      : m.content.map((p) => {
          if (p.type === "text") return { type: "text" as const, text: p.text };
          return { type: "text" as const, text: "[image]" };
        });
    if (m.role === "user") {
      result.push({ role: "user", content });
    } else {
      result.push({ role: "assistant", content: typeof content === "string" ? content : content.map(c => c.text).join("") });
    }
  }
  return result;
}

function toOpenAITools(tools: UnifiedToolDefinition[]): OpenAIChatTool[] {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema as Record<string, unknown>,
    },
  }));
}

function toUnifiedContent(
  message: OpenAI.Chat.Completions.ChatCompletionMessage
): UnifiedContentBlock[] {
  const blocks: UnifiedContentBlock[] = [];
  if (message.content) {
    blocks.push({ type: "text", text: message.content });
  }
  if (message.tool_calls) {
    for (const tc of message.tool_calls) {
      if (tc.type !== "function") continue;
      let input: Record<string, unknown> = {};
      try {
        input = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      } catch { /* empty */ }
      blocks.push({
        type: "tool_use",
        id: tc.id,
        name: tc.function.name,
        input,
      });
    }
  }
  return blocks;
}

export class OpenAIProvider implements LlmProvider {
  readonly name = "openai";
  readonly displayName = "OpenAI";
  private client: OpenAI;

  constructor(config?: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config?.apiKey ?? process.env.OPENAI_API_KEY,
      baseURL: config?.baseUrl,
      maxRetries: config?.maxRetries ?? 2,
      timeout: config?.timeoutMs ?? 120000,
    });
  }

  async call(request: UnifiedLlmRequest): Promise<UnifiedLlmResponse> {
    const start = Date.now();
    const messages = toOpenAIMessages(request.system, request.messages);
    const tools = request.tools?.length ? toOpenAITools(request.tools) : undefined;

    const response = await this.client.chat.completions.create({
      model: request.model,
      max_tokens: request.maxTokens ?? 4096,
      messages,
      tools,
      temperature: request.temperature,
      stop: request.stopSequences,
    });

    const choice = response.choices[0];
    const stopReason = choice?.finish_reason === "tool_calls" ? "tool_use" : choice?.finish_reason ?? null;

    return {
      content: choice?.message ? toUnifiedContent(choice.message) : [],
      stopReason,
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
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
    const messages = toOpenAIMessages(request.system, request.messages);
    const tools = request.tools?.length ? toOpenAITools(request.tools) : undefined;

    const stream = await this.client.chat.completions.create({
      model: request.model,
      max_tokens: request.maxTokens ?? 4096,
      messages,
      tools,
      temperature: request.temperature,
      stop: request.stopSequences,
      stream: true,
      stream_options: { include_usage: true },
    });

    let fullText = "";
    const toolCalls: Map<number, { id: string; name: string; args: string }> = new Map();
    let finishReason: string | null = null;
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullText += delta.content;
        callbacks?.onTextDelta?.(delta.content);
      }
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const existing = toolCalls.get(tc.index);
          if (!existing) {
            const id = tc.id ?? `call_${tc.index}`;
            const name = tc.function?.name ?? "";
            toolCalls.set(tc.index, { id, name, args: tc.function?.arguments ?? "" });
            if (name) callbacks?.onToolUseStart?.(name, id);
          } else {
            existing.args += tc.function?.arguments ?? "";
          }
        }
      }
      if (chunk.choices[0]?.finish_reason) {
        finishReason = chunk.choices[0].finish_reason;
      }
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens ?? 0;
        outputTokens = chunk.usage.completion_tokens ?? 0;
      }
    }

    callbacks?.onMessageDone?.(fullText);

    const content: UnifiedContentBlock[] = [];
    if (fullText) content.push({ type: "text", text: fullText });
    for (const [, tc] of toolCalls) {
      let input: Record<string, unknown> = {};
      try { input = JSON.parse(tc.args) as Record<string, unknown>; } catch { /* empty */ }
      content.push({ type: "tool_use", id: tc.id, name: tc.name, input });
    }

    return {
      content,
      stopReason: finishReason === "tool_calls" ? "tool_use" : finishReason,
      usage: { inputTokens, outputTokens },
      model: request.model,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  async countTokens(text: string, _model?: string): Promise<number> {
    return Math.ceil(text.length / 4);
  }

  listModels(): ModelInfo[] {
    return OPENAI_MODELS;
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.OPENAI_API_KEY;
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      await this.client.chat.completions.create({
        model: "gpt-4o-mini",
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
