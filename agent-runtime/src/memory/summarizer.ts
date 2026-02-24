import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";
import type { ClaudeClient } from "../llm/client.js";

const SUMMARIZE_THRESHOLD = 50;

export class ConversationSummarizer {
  constructor(private client: ClaudeClient) {}

  shouldSummarize(messages: MessageParam[]): boolean {
    return messages.length > SUMMARIZE_THRESHOLD;
  }

  async summarize(messages: MessageParam[]): Promise<{
    summary: string;
    retainedMessages: MessageParam[];
  }> {
    if (messages.length <= SUMMARIZE_THRESHOLD) {
      return { summary: "", retainedMessages: messages };
    }

    // Keep recent messages, summarize older ones
    const cutoff = messages.length - 20;
    const toSummarize = messages.slice(0, cutoff);
    const retained = messages.slice(cutoff);

    const conversationText = toSummarize
      .map((m) => {
        const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
        return `${m.role}: ${content}`;
      })
      .join("\n");

    const response = await this.client.call({
      model: "claude-haiku-4-5-20251001",
      system: "Summarize this conversation concisely, preserving key facts, decisions, and context needed to continue the conversation. Be thorough but brief.",
      messages: [{ role: "user", content: conversationText }],
      maxTokens: 1000,
    });

    const summaryBlock = response.content.find((b) => b.type === "text");
    const summary = summaryBlock && "text" in summaryBlock ? summaryBlock.text : "";

    return { summary, retainedMessages: retained };
  }
}
