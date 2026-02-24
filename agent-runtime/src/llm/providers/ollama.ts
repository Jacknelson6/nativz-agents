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

interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaTool {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: {
      type: string;
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

interface OllamaToolCall {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

interface OllamaChatResponse {
  model: string;
  message: {
    role: string;
    content: string;
    tool_calls?: OllamaToolCall[];
  };
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

const OLLAMA_MODELS: ModelInfo[] = [
  {
    id: "llama3.2:3b",
    name: "Llama 3.2 3B",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: false,
  },
  {
    id: "qwen2.5-coder:7b",
    name: "Qwen 2.5 Coder 7B",
    contextWindow: 32768,
    maxOutputTokens: 4096,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: false,
  },
];

function toOllamaMessages(system: string, messages: UnifiedMessage[]): OllamaChatMessage[] {
  const result: OllamaChatMessage[] = [{ role: "system", content: system }];
  for (const m of messages) {
    if (m.role === "system") continue;
    const content = typeof m.content === "string"
      ? m.content
      : m.content.map((p) => (p.type === "text" ? p.text : "")).join("");
    result.push({ role: m.role, content });
  }
  return result;
}

function toOllamaTools(tools: UnifiedToolDefinition[]): OllamaTool[] {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: {
        type: "object",
        properties: t.inputSchema.properties as Record<string, unknown>,
        required: t.inputSchema.required,
      },
    },
  }));
}

export class OllamaProvider implements LlmProvider {
  readonly name = "ollama";
  readonly displayName = "Ollama (Local)";
  private baseUrl: string;

  constructor(config?: ProviderConfig) {
    this.baseUrl = config?.baseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  }

  async call(request: UnifiedLlmRequest): Promise<UnifiedLlmResponse> {
    const start = Date.now();
    const messages = toOllamaMessages(request.system, request.messages);
    const tools = request.tools?.length ? toOllamaTools(request.tools) : undefined;

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      stream: false,
      options: {
        num_predict: request.maxTokens ?? 4096,
        temperature: request.temperature,
      },
    };
    if (tools) body.tools = tools;

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as OllamaChatResponse;

    const content: UnifiedContentBlock[] = [];
    if (data.message.content) {
      content.push({ type: "text", text: data.message.content });
    }
    if (data.message.tool_calls) {
      for (const tc of data.message.tool_calls) {
        content.push({
          type: "tool_use",
          id: `ollama_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: tc.function.name,
          input: tc.function.arguments,
        });
      }
    }

    const hasToolUse = content.some((b) => b.type === "tool_use");

    return {
      content,
      stopReason: hasToolUse ? "tool_use" : "end_turn",
      usage: {
        inputTokens: data.prompt_eval_count ?? 0,
        outputTokens: data.eval_count ?? 0,
      },
      model: data.model,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  async streamCall(
    request: UnifiedLlmRequest,
    callbacks?: UnifiedStreamCallbacks
  ): Promise<UnifiedLlmResponse> {
    const start = Date.now();
    const messages = toOllamaMessages(request.system, request.messages);
    const tools = request.tools?.length ? toOllamaTools(request.tools) : undefined;

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      stream: true,
      options: {
        num_predict: request.maxTokens ?? 4096,
        temperature: request.temperature,
      },
    };
    if (tools) body.tools = tools;

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
    if (!res.body) throw new Error("No response body from Ollama");

    let fullText = "";
    const allBlocks: UnifiedContentBlock[] = [];
    let inputTokens = 0;
    let outputTokens = 0;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const chunk = JSON.parse(line) as OllamaChatResponse;

        if (chunk.message?.content) {
          fullText += chunk.message.content;
          callbacks?.onTextDelta?.(chunk.message.content);
        }

        if (chunk.message?.tool_calls) {
          for (const tc of chunk.message.tool_calls) {
            const id = `ollama_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            callbacks?.onToolUseStart?.(tc.function.name, id);
            allBlocks.push({
              type: "tool_use",
              id,
              name: tc.function.name,
              input: tc.function.arguments,
            });
          }
        }

        if (chunk.done) {
          inputTokens = chunk.prompt_eval_count ?? 0;
          outputTokens = chunk.eval_count ?? 0;
        }
      }
    }

    callbacks?.onMessageDone?.(fullText);

    if (fullText) allBlocks.unshift({ type: "text", text: fullText });
    const hasToolUse = allBlocks.some((b) => b.type === "tool_use");

    return {
      content: allBlocks,
      stopReason: hasToolUse ? "tool_use" : "end_turn",
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
    return OLLAMA_MODELS;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
      return {
        available: res.ok,
        latencyMs: Date.now() - start,
        lastChecked: Date.now(),
      };
    } catch (err) {
      return {
        available: false,
        lastChecked: Date.now(),
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
