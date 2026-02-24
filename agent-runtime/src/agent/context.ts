import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";
import type { AgentManifest } from "./loader.js";
import type { KnowledgeSearch } from "../knowledge/search.js";
import type { MemoryStore, Memory } from "../memory/store.js";

export interface BuiltContext {
  system: string;
  messages: MessageParam[];
}

export function buildContext(opts: {
  manifest: AgentManifest;
  userMessage: string;
  conversationHistory: MessageParam[];
  knowledgeSearch?: KnowledgeSearch;
  memoryStore?: MemoryStore;
  userId?: string;
  conversationSummary?: string;
}): BuiltContext {
  const parts: string[] = [opts.manifest.systemPrompt];

  // Add relevant knowledge chunks
  if (opts.knowledgeSearch && opts.knowledgeSearch.size > 0) {
    const results = opts.knowledgeSearch.search(opts.userMessage, 5);
    if (results.length > 0) {
      parts.push("\n\n## Relevant Knowledge\n");
      for (const r of results) {
        if (r.score > 0.1) {
          parts.push(`---\n${r.chunk.content}\n`);
        }
      }
    }
  }

  // Add memories
  if (opts.memoryStore) {
    const userId = opts.userId ?? "default";
    const memories = opts.memoryStore.recall(opts.manifest.id, userId, opts.userMessage);
    if (memories.length > 0) {
      parts.push("\n\n## Relevant Memories\n");
      for (const m of memories) {
        parts.push(`- **${m.key}**: ${m.value}`);
      }
    }
  }

  const system = parts.join("\n");

  // Build messages with optional summary prefix
  const messages: MessageParam[] = [];
  if (opts.conversationSummary) {
    messages.push({
      role: "user",
      content: `[Previous conversation summary: ${opts.conversationSummary}]`,
    });
    messages.push({
      role: "assistant",
      content: "I understand the context from our previous conversation. How can I help you now?",
    });
  }
  messages.push(...opts.conversationHistory);

  return { system, messages };
}
