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

const OPENROUTER_MODELS: ModelInfo[] = [
  {
    id: "anthropic/claude-opus-4-20250514",
    name: "Claude Opus 4 (OpenRouter)",
    contextWindow: 200000,
    maxOutputTokens: 32768,
    inputCostPer1M: 15,
    outputCostPer1M: 75,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o (OpenRouter)",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputCostPer1M: 2.5,
    outputCostPer1M: 10,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: "google/gemini-2.5-pro-preview-05-06",
    name: "Gemini 2.5 Pro (OpenRouter)",
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    inputCostPer1M: 1.25,
    outputCostPer1M: 10,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: "meta-llama/llama-4-maverick",
    name: "Llama 4 Maverick (OpenRouter)",
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    inputCostPer1M: 0.5,
    outputCostPer1M: 0.77,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
];

type OpenAIMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;
type OpenAIChatTool = OpenAI.Chat.Completions.ChatCompletionTool;

function toOpenRouterMessages(system: string, messages: UnifiedMessage[]): OpenAIMessage[] {
  const result: OpenAIMessage[] = [{ role: "system", content: system }];
  for (const m of messages) {
    if (m.role === "system") continue;
    const content = typeof m.content === "string"
      ? m.content
      : m.content.map((p) => (p.type === "text" ? p.text : "")).join("");
    if (m.role === "user") {
      result.push({ role: "user", content });
    } else {
      result.push({ role: "assistant", content });
    }
  }
  return result;
}

function toOpenRouterTools(tools: UnifiedToolDefinition[]): OpenAIChatTool[] {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema as Record<string, unknown>,
    },
  }));
}

export class OpenRouterProvider implements LlmProvider {
  readonly name = "openrouter";
  readonly displayName = "OpenRouter";
  private client: OpenAI;

  constructor(config?: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config?.apiKey ?? process.env.OPENROUTER_API_KEY,
      baseURL: config?.baseUrl ?? "https://openrouter.ai/api/v1",
      maxRetries: config?.maxRetries ?? 2,
      timeout: config?.timeoutMs ?? 120000,
      defaultHeaders: {
        "HTTP-Referer": config?.metadata?.referer ?? "https://nativz.io",
        "X-Title": config?.metadata?.title ?? "Nativz Agents",
      },
    });
  }

  async call(request: UnifiedLlmRequest): Promise<UnifiedLlmResponse> {
    const start = Date.now();
    const messages = toOpenRouterMessages(request.system, request.messages);
    const tools = request.tools?.length ? toOpenRouterTools(request.tools) : undefined;

    const response = await this.client.chat.completions.create({
      model: request.model,
      max_tokens: request.maxTokens ?? 4096,
      messages,
      tools,
      temperature: request.temperature,
      stop: request.stopSequences,
    });

    const choice = response.choices[0];
    const content: UnifiedContentBlock[] = [];

    if (choice?.message?.content) {
      content.push({ type: "text", text: choice.message.content });
    }
    if (choice?.message?.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        if (tc.type !== "function") continue;
        let input: Record<string, unknown> = {};
        try { input = JSON.parse(tc.function.arguments) as Record<string, unknown>; } catch { /* empty */ }
        content.push({ type: "tool_use", id: tc.id, name: tc.function.name, input });
      }
    }

    const stopReason = choice?.finish_reason === "tool_calls" ? "tool_use" : choice?.finish_reason ?? null;

    return {
      content,
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
    const messages = toOpenRouterMessages(request.system, request.messages);
    const tools = request.tools?.length ? toOpenRouterTools(request.tools) : undefined;

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
    return OPENROUTER_MODELS;
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.OPENROUTER_API_KEY;
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ""}` },
        signal: AbortSignal.timeout(5000),
      });
      return { available: res.ok, latencyMs: Date.now() - start, lastChecked: Date.now() };
    } catch (err) {
      return {
        available: false,
        lastChecked: Date.now(),
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
