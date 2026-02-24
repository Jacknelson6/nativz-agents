import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";
import type { AgentManifest } from "./loader.js";
import type { KnowledgeSearch } from "../knowledge/search.js";
import type { MemoryStore } from "../memory/store.js";
import type { SearchResult } from "../knowledge/lancedb.js";
import type { ContextManager } from "../context/manager.js";

export interface BuiltContext {
  system: string;
  messages: MessageParam[];
}

export async function buildContext(opts: {
  manifest: AgentManifest;
  userMessage: string;
  conversationHistory: MessageParam[];
  knowledgeSearch?: KnowledgeSearch;
  memoryStore?: MemoryStore;
  userId?: string;
  conversationSummary?: string;
  workingMemoryXml?: string;
  skillContent?: string;
  contextManager?: ContextManager;
}): Promise<BuiltContext> {
  const parts: string[] = [opts.manifest.systemPrompt];

  // Add relevant knowledge chunks
  if (opts.knowledgeSearch && opts.knowledgeSearch.size > 0) {
    const results: SearchResult[] = await opts.knowledgeSearch.search(opts.userMessage, 5);
    if (results.length > 0) {
      if (opts.contextManager) {
        // Use context manager to prioritize knowledge within budget
        const budget = opts.contextManager.allocate(
          opts.manifest.context?.maxTokens ?? 100000
        );
        const prioritized = opts.contextManager.prioritizeKnowledge(
          results.map((r) => ({
            content: r.content,
            relevance: r.score,
            source: r.source,
          })),
          budget.knowledge
        );
        if (prioritized.length > 0) {
          parts.push("\n\n<knowledge>");
          for (const chunk of prioritized) {
            parts.push(`<chunk source="${chunk.source ?? "unknown"}">${chunk.content}</chunk>`);
          }
          parts.push("</knowledge>");
        }
      } else {
        parts.push("\n\n## Relevant Knowledge\n");
        for (const r of results) {
          if (r.score > 0.1) {
            parts.push(`---\n${r.content}\n`);
          }
        }
      }
    }
  }

  // Add working memory
  if (opts.workingMemoryXml) {
    parts.push(`\n\n${opts.workingMemoryXml}`);
  }

  // Add matched skills
  if (opts.skillContent) {
    parts.push(`\n\n<skills>\n${opts.skillContent}\n</skills>`);
  }

  // Add memories
  if (opts.memoryStore) {
    const userId = opts.userId ?? "default";
    const memories = opts.memoryStore.recall(opts.manifest.id, userId, opts.userMessage);
    if (memories.length > 0) {
      parts.push("\n\n<memories>");
      for (const m of memories) {
        parts.push(`<memory key="${m.key}">${m.value}</memory>`);
      }
      parts.push("</memories>");
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
