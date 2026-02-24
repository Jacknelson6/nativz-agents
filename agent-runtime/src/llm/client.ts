/**
 * Backward-compatible facade over the multi-provider system.
 * Existing code using ClaudeClient continues to work unchanged.
 */
import type { MessageParam, ContentBlock } from "@anthropic-ai/sdk/resources/messages.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import type { UnifiedLlmRequest, UnifiedMessage, UnifiedToolDefinition } from "./providers/types.js";

export interface LlmCallOptions {
  model: string;
  system: string;
  messages: MessageParam[];
  tools?: Array<{
    name: string;
    description?: string;
    input_schema: {
      type: "object";
      properties?: unknown;
      required?: string[];
    };
  }>;
  maxTokens?: number;
}

export interface LlmResponse {
  content: ContentBlock[];
  stopReason: string | null;
  usage: { inputTokens: number; outputTokens: number };
}

export interface StreamCallbacks {
  onTextDelta?: (text: string) => void;
  onToolUseStart?: (name: string, id: string) => void;
  onMessageDone?: (fullText: string) => void;
}

function convertMessages(messages: MessageParam[]): UnifiedMessage[] {
  return messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: typeof m.content === "string"
      ? m.content
      : JSON.stringify(m.content),
  }));
}

function convertTools(
  tools?: LlmCallOptions["tools"]
): UnifiedToolDefinition[] | undefined {
  if (!tools?.length) return undefined;
  return tools.map((t) => {
    const props = (t.input_schema.properties ?? {}) as Record<string, Record<string, unknown>>;
    return {
      name: t.name,
      description: t.description,
      inputSchema: {
        type: "object" as const,
        properties: Object.fromEntries(
          Object.entries(props).map(([k, v]) => [k, {
            type: (v.type as string) ?? "string",
            description: (v.description as string) ?? undefined,
          }])
        ),
        required: t.input_schema.required,
      },
    };
  });
}

function toContentBlocks(
  content: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>
): ContentBlock[] {
  // Cast unified blocks back to Anthropic ContentBlock shape
  // They share the same structure for text and tool_use
  return content as unknown as ContentBlock[];
}

export class ClaudeClient {
  private provider: AnthropicProvider;

  constructor(apiKey?: string) {
    this.provider = new AnthropicProvider({ apiKey });
  }

  async call(options: LlmCallOptions): Promise<LlmResponse> {
    const request: UnifiedLlmRequest = {
      model: options.model,
      system: options.system,
      messages: convertMessages(options.messages),
      tools: convertTools(options.tools),
      maxTokens: options.maxTokens,
    };

    const response = await this.provider.call(request);

    return {
      content: toContentBlocks(response.content),
      stopReason: response.stopReason,
      usage: response.usage,
    };
  }

  async streamCall(
    options: LlmCallOptions,
    callbacks?: StreamCallbacks
  ): Promise<LlmResponse> {
    const request: UnifiedLlmRequest = {
      model: options.model,
      system: options.system,
      messages: convertMessages(options.messages),
      tools: convertTools(options.tools),
      maxTokens: options.maxTokens,
    };

    const response = await this.provider.streamCall(request, callbacks);

    return {
      content: toContentBlocks(response.content),
      stopReason: response.stopReason,
      usage: response.usage,
    };
  }
}
