/**
 * Search Result Reranker — heuristic + optional LLM-based reranking.
 */

export interface RerankableResult {
  content: string;
  score: number;
  source?: string;
  metadata?: Record<string, string>;
}

export interface RerankConfig {
  useLlm: boolean;
  topK: number;
  queryTermWeight: number;
  positionBiasDecay: number;
  chunkQualityWeight: number;
}

type LLMCallFn = (prompt: string) => Promise<string>;

const DEFAULT_CONFIG: RerankConfig = {
  useLlm: false,
  topK: 5,
  queryTermWeight: 0.4,
  positionBiasDecay: 0.05,
  chunkQualityWeight: 0.3,
};

const LLM_RERANK_PROMPT = `Rate the relevance of each document to the query on a scale of 0-10.

Query: {query}

Documents:
{documents}

Return ONLY valid JSON: {"scores": [number, number, ...]} in the same order as the documents.
`;

export class Reranker {
  private config: RerankConfig;

  constructor(config?: Partial<RerankConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async rerank(
    query: string,
    results: RerankableResult[],
    llmCall?: LLMCallFn
  ): Promise<RerankableResult[]> {
    if (results.length <= 1) return results;

    if (this.config.useLlm && llmCall) {
      return this.llmRerank(query, results, llmCall);
    }

    return this.heuristicRerank(query, results);
  }

  private heuristicRerank(query: string, results: RerankableResult[]): RerankableResult[] {
    const queryTerms = this.tokenize(query);

    const scored = results.map((result, index) => {
      const termDensity = this.queryTermDensity(queryTerms, result.content);
      const positionBias = Math.exp(-this.config.positionBiasDecay * index);
      const chunkQuality = this.assessChunkQuality(result.content);

      const combinedScore =
        result.score * 0.3 +
        termDensity * this.config.queryTermWeight +
        positionBias * (1 - this.config.queryTermWeight - this.config.chunkQualityWeight) +
        chunkQuality * this.config.chunkQualityWeight;

      return { result, combinedScore };
    });

    scored.sort((a, b) => b.combinedScore - a.combinedScore);

    return scored.slice(0, this.config.topK).map((s) => ({
      ...s.result,
      score: s.combinedScore,
    }));
  }

  private async llmRerank(
    query: string,
    results: RerankableResult[],
    llmCall: LLMCallFn
  ): Promise<RerankableResult[]> {
    const truncated = results.slice(0, 10);
    const docList = truncated
      .map((r, i) => `[${i + 1}] ${r.content.slice(0, 300)}`)
      .join("\n\n");

    const prompt = LLM_RERANK_PROMPT
      .replace("{query}", query)
      .replace("{documents}", docList);

    try {
      const raw = await llmCall(prompt);
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return this.heuristicRerank(query, results);

      const parsed = JSON.parse(match[0]) as { scores: number[] };
      if (!Array.isArray(parsed.scores) || parsed.scores.length !== truncated.length) {
        return this.heuristicRerank(query, results);
      }

      const withScores = truncated.map((r, i) => ({
        result: r,
        llmScore: parsed.scores[i] / 10,
      }));

      withScores.sort((a, b) => b.llmScore - a.llmScore);

      return withScores.slice(0, this.config.topK).map((s) => ({
        ...s.result,
        score: s.llmScore,
      }));
    } catch {
      return this.heuristicRerank(query, results);
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  private queryTermDensity(queryTerms: string[], content: string): number {
    if (queryTerms.length === 0) return 0;
    const contentLower = content.toLowerCase();
    let matches = 0;
    for (const term of queryTerms) {
      if (contentLower.includes(term)) matches++;
    }
    return matches / queryTerms.length;
  }

  private assessChunkQuality(content: string): number {
    let score = 0;

    // Length penalty for very short or very long chunks
    const len = content.length;
    if (len > 100 && len < 2000) score += 0.3;
    else if (len >= 50 && len <= 3000) score += 0.15;

    // Sentence structure (has periods/question marks)
    const sentenceCount = (content.match(/[.!?]+/g) ?? []).length;
    if (sentenceCount >= 2) score += 0.3;

    // Not mostly code/noise
    const alphaRatio = (content.match(/[a-zA-Z]/g) ?? []).length / Math.max(1, content.length);
    if (alphaRatio > 0.5) score += 0.2;

    // Has some structure (paragraphs, lists)
    if (content.includes("\n")) score += 0.1;

    // Caps at 1.0
    return Math.min(1, score + 0.1);
  }
}
