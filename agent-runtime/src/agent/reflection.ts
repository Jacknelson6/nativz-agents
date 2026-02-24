/**
 * Self-Reflection Engine — critiques and optionally revises agent responses.
 */

export interface ReflectionResult {
  shouldRevise: boolean;
  critique: string;
  revisedResponse?: string;
  complexityScore: number;
}

interface ReflectionHistoryEntry {
  timestamp: string;
  userMessage: string;
  originalResponse: string;
  critique: string;
  revised: boolean;
}

type LLMCallFn = (prompt: string) => Promise<string>;

const COMPLEXITY_PROMPT = `Rate the complexity of this user request on a scale from 0.0 to 1.0.
Consider: multi-step reasoning, ambiguity, domain expertise required, potential for errors.
Return ONLY a JSON object: {"score": 0.X}

User message: `;

const REFLECTION_PROMPT = `You are a critical reviewer. Examine this AI response to a user query and provide honest feedback.

User asked: {userMessage}

AI responded: {response}

Analyze:
1. Is the response accurate and complete?
2. Are there logical errors or missing information?
3. Could the response be misleading?
4. Is the tone appropriate?

Return ONLY valid JSON:
{
  "shouldRevise": true/false,
  "critique": "specific issues found or 'Response is adequate'",
  "revisedResponse": "improved response if shouldRevise is true, omit if false"
}
`;

const COMPLEXITY_THRESHOLD = 0.7;
const MAX_REFLECTIONS_PER_TURN = 1;

export class ReflectionEngine {
  private history: ReflectionHistoryEntry[] = [];
  private reflectionsThisTurn = 0;

  resetTurn(): void {
    this.reflectionsThisTurn = 0;
  }

  getHistory(): ReadonlyArray<ReflectionHistoryEntry> {
    return this.history;
  }

  async assessComplexity(userMessage: string, llmCall: LLMCallFn): Promise<number> {
    try {
      const raw = await llmCall(COMPLEXITY_PROMPT + userMessage);
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return 0.5;
      const parsed = JSON.parse(match[0]) as { score: number };
      return Math.max(0, Math.min(1, parsed.score));
    } catch {
      return 0.5;
    }
  }

  async reflect(
    response: string,
    userMessage: string,
    llmCall: LLMCallFn
  ): Promise<ReflectionResult> {
    const complexityScore = await this.assessComplexity(userMessage, llmCall);

    if (complexityScore < COMPLEXITY_THRESHOLD) {
      return { shouldRevise: false, critique: "Below complexity threshold — skipping reflection.", complexityScore };
    }

    if (this.reflectionsThisTurn >= MAX_REFLECTIONS_PER_TURN) {
      return { shouldRevise: false, critique: "Max reflections reached for this turn.", complexityScore };
    }

    this.reflectionsThisTurn++;

    const prompt = REFLECTION_PROMPT
      .replace("{userMessage}", userMessage)
      .replace("{response}", response);

    try {
      const raw = await llmCall(prompt);
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return { shouldRevise: false, critique: "Failed to parse reflection.", complexityScore };
      }

      const parsed = JSON.parse(match[0]) as {
        shouldRevise: boolean;
        critique: string;
        revisedResponse?: string;
      };

      this.history.push({
        timestamp: new Date().toISOString(),
        userMessage,
        originalResponse: response,
        critique: parsed.critique,
        revised: parsed.shouldRevise,
      });

      // Keep history bounded
      if (this.history.length > 100) {
        this.history = this.history.slice(-50);
      }

      return {
        shouldRevise: parsed.shouldRevise,
        critique: parsed.critique,
        revisedResponse: parsed.revisedResponse,
        complexityScore,
      };
    } catch {
      return { shouldRevise: false, critique: "Reflection failed.", complexityScore };
    }
  }
}
