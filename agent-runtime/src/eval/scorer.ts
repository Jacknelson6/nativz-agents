/**
 * Per-turn quality scoring using heuristics (no LLM calls).
 */

export interface QualityScore {
  relevance: number;
  completeness: number;
  toolEfficiency: number;
  responseLength: number;
  overall: number;
}

export interface ToolCallInfo {
  name: string;
  input: Record<string, unknown>;
  result: string;
}

export class TurnScorer {
  /**
   * Score a single turn using heuristic metrics.
   */
  scoreTurn(
    userMessage: string,
    assistantResponse: string,
    toolCalls: ToolCallInfo[]
  ): QualityScore {
    const relevance = this.scoreRelevance(userMessage, assistantResponse);
    const completeness = this.scoreCompleteness(userMessage, assistantResponse);
    const toolEfficiency = this.scoreToolEfficiency(userMessage, toolCalls);
    const responseLength = this.scoreResponseLength(assistantResponse);

    const overall =
      relevance * 0.35 + completeness * 0.3 + toolEfficiency * 0.2 + responseLength * 0.15;

    return { relevance, completeness, toolEfficiency, responseLength, overall };
  }

  private scoreRelevance(userMessage: string, response: string): number {
    const userWords = this.extractKeywords(userMessage);
    if (userWords.length === 0) return 0.5;

    const responseLower = response.toLowerCase();
    let matches = 0;
    for (const word of userWords) {
      if (responseLower.includes(word)) matches++;
    }

    return Math.min(1, matches / userWords.length);
  }

  private scoreCompleteness(userMessage: string, response: string): number {
    // Heuristic: questions in user message vs length/structure of response
    const questionCount = (userMessage.match(/\?/g) ?? []).length;
    const hasQuestion = questionCount > 0 || /^(what|how|why|when|where|who|can|do|is|are|will|should)/i.test(userMessage);

    if (!hasQuestion) {
      // For non-questions, moderate length = complete
      return response.length > 20 ? Math.min(1, response.length / 200) : 0.3;
    }

    // For questions, longer responses tend to be more complete
    const baseScore = Math.min(1, response.length / 300);

    // Bonus for structured responses (lists, paragraphs)
    const hasList = /[-•*]\s/.test(response) || /\d+\.\s/.test(response);
    const bonus = hasList ? 0.15 : 0;

    return Math.min(1, baseScore + bonus);
  }

  private scoreToolEfficiency(userMessage: string, toolCalls: ToolCallInfo[]): number {
    // Heuristic: does the message seem to need tools?
    const toolIndicators = [
      "search", "find", "look up", "calculate", "create", "generate",
      "send", "write", "read", "open", "browse", "check",
    ];
    const lowerMsg = userMessage.toLowerCase();
    const seemsToNeedTools = toolIndicators.some((ind) => lowerMsg.includes(ind));

    if (!seemsToNeedTools && toolCalls.length === 0) return 1.0;
    if (!seemsToNeedTools && toolCalls.length > 0) return 0.7; // Used tools unnecessarily?
    if (seemsToNeedTools && toolCalls.length === 0) return 0.3; // Should have used tools
    // Used tools when needed — penalize excessive calls
    if (toolCalls.length <= 3) return 1.0;
    if (toolCalls.length <= 6) return 0.8;
    return Math.max(0.3, 1 - (toolCalls.length - 3) * 0.1);
  }

  private scoreResponseLength(response: string): number {
    const len = response.length;
    // Too short is bad, too long is slightly bad, medium is ideal
    if (len < 10) return 0.1;
    if (len < 50) return 0.4;
    if (len <= 500) return 1.0;
    if (len <= 1500) return 0.9;
    if (len <= 3000) return 0.7;
    return 0.5;
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
      "have", "has", "had", "do", "does", "did", "will", "would", "could",
      "should", "may", "might", "can", "shall", "to", "of", "in", "for",
      "on", "with", "at", "by", "from", "as", "into", "through", "during",
      "before", "after", "above", "below", "between", "and", "but", "or",
      "not", "no", "so", "if", "then", "than", "too", "very", "just",
      "about", "up", "out", "it", "its", "i", "me", "my", "you", "your",
      "we", "our", "they", "them", "their", "this", "that", "these", "those",
      "what", "which", "who", "whom", "how", "when", "where", "why",
      "all", "each", "every", "both", "few", "more", "most", "other",
      "some", "such", "only", "own", "same", "also",
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
  }
}
