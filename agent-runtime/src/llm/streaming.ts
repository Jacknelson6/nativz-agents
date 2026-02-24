import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, Tool } from "@anthropic-ai/sdk/resources/messages.js";
import type { MessageStreamEvent } from "@anthropic-ai/sdk/resources/messages.js";

export interface StreamCallOptions {
  model: string;
  system: string;
  messages: MessageParam[];
  tools?: Tool[];
  maxTokens?: number;
  onToken?: (token: string) => void;
  onToolUse?: (toolName: string, toolInput: Record<string, unknown>) => void;
}

export async function streamCall(
  client: Anthropic,
  options: StreamCallOptions
): Promise<Anthropic.Message> {
  const stream = client.messages.stream({
    model: options.model,
    max_tokens: options.maxTokens ?? 4096,
    system: options.system,
    messages: options.messages,
    tools: options.tools,
  });

  stream.on("text", (text) => {
    options.onToken?.(text);
  });

  const finalMessage = await stream.finalMessage();
  return finalMessage;
}
