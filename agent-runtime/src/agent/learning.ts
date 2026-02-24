/**
 * Agent Learning from Feedback
 * Extracts patterns from user feedback, stores them, and applies in future turns.
 */

import { randomUUID } from "node:crypto";

// ---- Types ----

export interface LearnedPattern {
  id: string;
  agentId: string;
  category: "tone" | "format" | "content" | "behavior" | "correction" | "preference";
  pattern: string;
  source: {
    conversationId: string;
    feedback: string;
    originalOutput?: string;
  };
  confidence: number;
  appliedCount: number;
  createdAt: number;
  updatedAt: number;
  active: boolean;
}

export interface FeedbackSignal {
  type: "positive" | "negative" | "correction";
  message: string;
  conversationId: string;
  originalOutput?: string;
}

export interface LearningStore {
  save(pattern: LearnedPattern): Promise<void>;
  getByAgent(agentId: string, activeOnly?: boolean): Promise<LearnedPattern[]>;
  getById(id: string): Promise<LearnedPattern | null>;
  update(id: string, updates: Partial<LearnedPattern>): Promise<void>;
  delete(id: string): Promise<void>;
  search(agentId: string, query: string): Promise<LearnedPattern[]>;
}

export interface PatternExtractor {
  (feedback: FeedbackSignal): Promise<ExtractedLesson | null>;
}

export interface ExtractedLesson {
  category: LearnedPattern["category"];
  pattern: string;
  confidence: number;
}

// ---- In-Memory Store ----

class InMemoryLearningStore implements LearningStore {
  private patterns: LearnedPattern[] = [];

  async save(pattern: LearnedPattern): Promise<void> {
    this.patterns.push(pattern);
  }

  async getByAgent(agentId: string, activeOnly = true): Promise<LearnedPattern[]> {
    return this.patterns.filter(
      (p) => p.agentId === agentId && (!activeOnly || p.active)
    );
  }

  async getById(id: string): Promise<LearnedPattern | null> {
    return this.patterns.find((p) => p.id === id) ?? null;
  }

  async update(id: string, updates: Partial<LearnedPattern>): Promise<void> {
    const idx = this.patterns.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.patterns[idx] = { ...this.patterns[idx], ...updates, updatedAt: Date.now() };
    }
  }

  async delete(id: string): Promise<void> {
    this.patterns = this.patterns.filter((p) => p.id !== id);
  }

  async search(agentId: string, query: string): Promise<LearnedPattern[]> {
    const lower = query.toLowerCase();
    return this.patterns.filter(
      (p) =>
        p.agentId === agentId &&
        p.active &&
        (p.pattern.toLowerCase().includes(lower) ||
          p.category.toLowerCase().includes(lower))
    );
  }
}

// ---- Feedback Detector ----

const POSITIVE_SIGNALS = [
  "that was great", "perfect", "exactly", "love it", "well done",
  "that's right", "good job", "nice", "awesome", "excellent",
];

const NEGATIVE_SIGNALS = [
  "that's wrong", "not what i asked", "incorrect", "no,", "bad",
  "too long", "too short", "too formal", "too casual", "don't do that",
  "stop doing", "never", "i hate", "doesn't work",
];

const CORRECTION_SIGNALS = [
  "instead", "actually", "i meant", "what i want is", "please change",
  "should be", "fix", "correct this", "i prefer", "always use",
  "never use", "from now on",
];

export function detectFeedbackType(message: string): FeedbackSignal["type"] | null {
  const lower = message.toLowerCase();
  if (CORRECTION_SIGNALS.some((s) => lower.includes(s))) return "correction";
  if (NEGATIVE_SIGNALS.some((s) => lower.includes(s))) return "negative";
  if (POSITIVE_SIGNALS.some((s) => lower.includes(s))) return "positive";
  return null;
}

// ---- Default Pattern Extractor ----

function defaultExtractor(): PatternExtractor {
  return async (feedback: FeedbackSignal): Promise<ExtractedLesson | null> => {
    const msg = feedback.message.toLowerCase();

    // Tone corrections
    if (msg.includes("formal") || msg.includes("casual") || msg.includes("professional")) {
      const tone = msg.includes("formal") || msg.includes("professional") ? "formal" : "casual";
      return {
        category: "tone",
        pattern: `User prefers ${tone} tone in responses`,
        confidence: 0.8,
      };
    }

    // Format preferences
    if (msg.includes("bullet") || msg.includes("list") || msg.includes("short") || msg.includes("long")) {
      return {
        category: "format",
        pattern: `User feedback on format: "${feedback.message}"`,
        confidence: 0.7,
      };
    }

    // Direct corrections
    if (feedback.type === "correction") {
      return {
        category: "correction",
        pattern: `Correction: "${feedback.message}"`,
        confidence: 0.9,
      };
    }

    // Positive reinforcement
    if (feedback.type === "positive" && feedback.originalOutput) {
      return {
        category: "preference",
        pattern: `User liked this approach: "${feedback.originalOutput.slice(0, 200)}"`,
        confidence: 0.6,
      };
    }

    // General negative
    if (feedback.type === "negative") {
      return {
        category: "behavior",
        pattern: `Avoid: "${feedback.message}"`,
        confidence: 0.7,
      };
    }

    return null;
  };
}

// ---- Agent Learner ----

export class AgentLearner {
  private agentId: string;
  private store: LearningStore;
  private extractor: PatternExtractor;

  constructor(
    agentId: string,
    options?: {
      store?: LearningStore;
      extractor?: PatternExtractor;
    }
  ) {
    this.agentId = agentId;
    this.store = options?.store ?? new InMemoryLearningStore();
    this.extractor = options?.extractor ?? defaultExtractor();
  }

  /**
   * Process a user message for feedback signals. Returns the learned pattern if any.
   */
  async processFeedback(
    message: string,
    conversationId: string,
    originalOutput?: string
  ): Promise<LearnedPattern | null> {
    const feedbackType = detectFeedbackType(message);
    if (!feedbackType) return null;

    const signal: FeedbackSignal = {
      type: feedbackType,
      message,
      conversationId,
      originalOutput,
    };

    const lesson = await this.extractor(signal);
    if (!lesson) return null;

    // Check for duplicate patterns
    const existing = await this.store.getByAgent(this.agentId);
    const duplicate = existing.find(
      (p) => p.category === lesson.category && p.pattern === lesson.pattern
    );
    if (duplicate) {
      await this.store.update(duplicate.id, {
        confidence: Math.min(1, duplicate.confidence + 0.1),
      });
      return duplicate;
    }

    const pattern: LearnedPattern = {
      id: randomUUID(),
      agentId: this.agentId,
      category: lesson.category,
      pattern: lesson.pattern,
      source: { conversationId, feedback: message, originalOutput },
      confidence: lesson.confidence,
      appliedCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      active: true,
    };

    await this.store.save(pattern);
    return pattern;
  }

  /**
   * Get patterns to inject into agent context for a conversation.
   */
  async getActivePatterns(): Promise<LearnedPattern[]> {
    const patterns = await this.store.getByAgent(this.agentId, true);
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Format learned patterns as a system prompt section.
   */
  async buildLearningContext(): Promise<string> {
    const patterns = await this.getActivePatterns();
    if (patterns.length === 0) return "";

    const lines = patterns.map(
      (p) => `  - [${p.category}] ${p.pattern} (confidence: ${(p.confidence * 100).toFixed(0)}%)`
    );

    return [
      "<learned_patterns>",
      "  The following patterns were learned from user feedback. Apply them:",
      ...lines,
      "</learned_patterns>",
    ].join("\n");
  }

  /**
   * Record that a pattern was used in generating a response.
   */
  async markApplied(patternId: string): Promise<void> {
    const pattern = await this.store.getById(patternId);
    if (pattern) {
      await this.store.update(patternId, { appliedCount: pattern.appliedCount + 1 });
    }
  }

  /**
   * Unlearn — deactivate a pattern.
   */
  async unlearn(patternId: string): Promise<void> {
    await this.store.update(patternId, { active: false });
  }

  /**
   * Unlearn by keyword — deactivate patterns matching a query.
   */
  async unlearnByQuery(query: string): Promise<number> {
    const matches = await this.store.search(this.agentId, query);
    for (const m of matches) {
      await this.store.update(m.id, { active: false });
    }
    return matches.length;
  }

  /**
   * Get learning history.
   */
  async getHistory(includeInactive = false): Promise<LearnedPattern[]> {
    return this.store.getByAgent(this.agentId, !includeInactive);
  }

  /**
   * Get learning stats.
   */
  async getStats(): Promise<{
    totalPatterns: number;
    activePatterns: number;
    byCategory: Record<string, number>;
    totalApplications: number;
  }> {
    const all = await this.store.getByAgent(this.agentId, false);
    const active = all.filter((p) => p.active);
    const byCategory: Record<string, number> = {};
    let totalApplications = 0;

    for (const p of active) {
      byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
      totalApplications += p.appliedCount;
    }

    return {
      totalPatterns: all.length,
      activePatterns: active.length,
      byCategory,
      totalApplications,
    };
  }
}
