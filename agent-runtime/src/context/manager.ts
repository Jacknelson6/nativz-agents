/**
 * Context Budget Manager — manages token budget allocation across prompt sections.
 * Standalone: no coupling to specific runtime.
 */

export interface BudgetAllocation {
  system: number;
  workingMemory: number;
  knowledge: number;
  history: number;
  tools: number;
}

export interface BudgetResult {
  system: number;
  workingMemory: number;
  knowledge: number;
  history: number;
  tools: number;
  total: number;
}

export interface BudgetUsage {
  section: string;
  allocated: number;
  actual: number;
  utilization: number;
}

export interface KnowledgeChunk {
  content: string;
  relevance: number;
  source?: string;
}

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

export interface PromptSections {
  xml: string;
  usage: BudgetUsage[];
}

const DEFAULT_ALLOCATION: BudgetAllocation = {
  system: 0.2,
  workingMemory: 0.1,
  knowledge: 0.2,
  history: 0.4,
  tools: 0.1,
};

export class ContextManager {
  private allocation: BudgetAllocation;
  private lastUsage: BudgetUsage[] = [];

  constructor(allocation?: Partial<BudgetAllocation>) {
    this.allocation = { ...DEFAULT_ALLOCATION, ...allocation };
    // Normalize to sum to 1
    const total =
      this.allocation.system +
      this.allocation.workingMemory +
      this.allocation.knowledge +
      this.allocation.history +
      this.allocation.tools;
    if (Math.abs(total - 1) > 0.01) {
      this.allocation.system /= total;
      this.allocation.workingMemory /= total;
      this.allocation.knowledge /= total;
      this.allocation.history /= total;
      this.allocation.tools /= total;
    }
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  allocate(totalBudget: number, config?: Partial<BudgetAllocation>): BudgetResult {
    const alloc = config ? { ...this.allocation, ...config } : this.allocation;
    return {
      system: Math.floor(totalBudget * alloc.system),
      workingMemory: Math.floor(totalBudget * alloc.workingMemory),
      knowledge: Math.floor(totalBudget * alloc.knowledge),
      history: Math.floor(totalBudget * alloc.history),
      tools: Math.floor(totalBudget * alloc.tools),
      total: totalBudget,
    };
  }

  compressHistory(messages: HistoryMessage[], maxTokens: number): HistoryMessage[] {
    const totalTokens = messages.reduce((sum, m) => sum + this.estimateTokens(m.content), 0);
    if (totalTokens <= maxTokens) return messages;

    // Keep recent messages, summarize older ones
    const result: HistoryMessage[] = [];
    let tokensUsed = 0;

    // Always keep the most recent messages (walk backwards)
    const reversed = [...messages].reverse();
    const kept: HistoryMessage[] = [];

    for (const msg of reversed) {
      const msgTokens = this.estimateTokens(msg.content);
      if (tokensUsed + msgTokens <= maxTokens * 0.7) {
        kept.unshift(msg);
        tokensUsed += msgTokens;
      } else {
        break;
      }
    }

    // Summarize the older messages that didn't fit
    const olderMessages = messages.slice(0, messages.length - kept.length);
    if (olderMessages.length > 0) {
      const summaryParts: string[] = [];
      for (const msg of olderMessages) {
        const truncated =
          msg.content.length > 100 ? msg.content.slice(0, 100) + "..." : msg.content;
        summaryParts.push(`[${msg.role}]: ${truncated}`);
      }
      const summaryText = `[Summary of ${olderMessages.length} earlier messages: ${summaryParts.join(" | ")}]`;
      const summaryTokens = this.estimateTokens(summaryText);

      if (summaryTokens + tokensUsed <= maxTokens) {
        result.push({ role: "assistant", content: summaryText });
      }
    }

    result.push(...kept);
    return result;
  }

  prioritizeKnowledge(chunks: KnowledgeChunk[], maxTokens: number): KnowledgeChunk[] {
    // Sort by relevance descending
    const sorted = [...chunks].sort((a, b) => b.relevance - a.relevance);
    const result: KnowledgeChunk[] = [];
    let tokensUsed = 0;

    for (const chunk of sorted) {
      const chunkTokens = this.estimateTokens(chunk.content);
      if (tokensUsed + chunkTokens <= maxTokens) {
        result.push(chunk);
        tokensUsed += chunkTokens;
      } else {
        // Try to fit a truncated version
        const remaining = maxTokens - tokensUsed;
        if (remaining > 50) {
          const truncatedContent = chunk.content.slice(0, remaining * 4);
          result.push({ ...chunk, content: truncatedContent });
        }
        break;
      }
    }

    return result;
  }

  buildPromptSections(opts: {
    systemPrompt: string;
    workingMemory: string;
    knowledge: KnowledgeChunk[];
    history: HistoryMessage[];
    tools?: string;
    totalBudget: number;
  }): PromptSections {
    const budget = this.allocate(opts.totalBudget);
    const usage: BudgetUsage[] = [];

    // System prompt — truncate if over budget
    let systemContent = opts.systemPrompt;
    const systemTokens = this.estimateTokens(systemContent);
    if (systemTokens > budget.system) {
      systemContent = systemContent.slice(0, budget.system * 4);
    }
    usage.push({
      section: "system",
      allocated: budget.system,
      actual: this.estimateTokens(systemContent),
      utilization: this.estimateTokens(systemContent) / budget.system,
    });

    // Working memory
    let memoryContent = opts.workingMemory;
    const memoryTokens = this.estimateTokens(memoryContent);
    if (memoryTokens > budget.workingMemory) {
      memoryContent = memoryContent.slice(0, budget.workingMemory * 4);
    }
    usage.push({
      section: "workingMemory",
      allocated: budget.workingMemory,
      actual: this.estimateTokens(memoryContent),
      utilization: this.estimateTokens(memoryContent) / (budget.workingMemory || 1),
    });

    // Knowledge — prioritize and truncate
    const prioritized = this.prioritizeKnowledge(opts.knowledge, budget.knowledge);
    const knowledgeContent = prioritized.map((c) => c.content).join("\n\n");
    usage.push({
      section: "knowledge",
      allocated: budget.knowledge,
      actual: this.estimateTokens(knowledgeContent),
      utilization: this.estimateTokens(knowledgeContent) / (budget.knowledge || 1),
    });

    // History — compress if needed
    const compressed = this.compressHistory(opts.history, budget.history);
    const historyContent = compressed.map((m) => `<${m.role}>${m.content}</${m.role}>`).join("\n");
    usage.push({
      section: "history",
      allocated: budget.history,
      actual: this.estimateTokens(historyContent),
      utilization: this.estimateTokens(historyContent) / (budget.history || 1),
    });

    // Tools
    const toolsContent = opts.tools ?? "";
    usage.push({
      section: "tools",
      allocated: budget.tools,
      actual: this.estimateTokens(toolsContent),
      utilization: this.estimateTokens(toolsContent) / (budget.tools || 1),
    });

    this.lastUsage = usage;

    const xml = `<context>
<system_prompt>${systemContent}</system_prompt>
<working_memory>${memoryContent}</working_memory>
<knowledge>${knowledgeContent}</knowledge>
<conversation_history>${historyContent}</conversation_history>
</context>`;

    return { xml, usage };
  }

  getLastUsage(): BudgetUsage[] {
    return this.lastUsage;
  }
}
