import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, Tool, ContentBlock } from "@anthropic-ai/sdk/resources/messages.js";

export interface LlmCallOptions {
  model: string;
  system: string;
  messages: MessageParam[];
  tools?: Tool[];
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

export class ClaudeClient {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
  }

  async call(options: LlmCallOptions): Promise<LlmResponse> {
    const response = await this.client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens ?? 4096,
      system: options.system,
      messages: options.messages,
      tools: options.tools,
    });

    return {
      content: response.content,
      stopReason: response.stop_reason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  async streamCall(options: LlmCallOptions, callbacks?: StreamCallbacks): Promise<LlmResponse> {
    try {
      const stream = this.client.messages.stream({
        model: options.model,
        max_tokens: options.maxTokens ?? 4096,
        system: options.system,
        messages: options.messages,
        tools: options.tools,
      });

      stream.on("text", (text) => {
        callbacks?.onTextDelta?.(text);
      });

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
        content: finalMessage.content,
        stopReason: finalMessage.stop_reason,
        usage: {
          inputTokens: finalMessage.usage.input_tokens,
          outputTokens: finalMessage.usage.output_tokens,
        },
      };
    } catch (err) {
      // Fallback to non-streaming
      return this.call(options);
    }
  }
}
