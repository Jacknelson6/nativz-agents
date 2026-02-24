import type { StructuredMemory, MemoryCategory, EntityType } from "./structured.js";

export type LLMFunction = (prompt: string) => Promise<string>;

interface ExtractedFact {
  entityId: string;
  entityType: EntityType;
  category: MemoryCategory;
  content: string;
  confidence: number;
}

const EXTRACTION_PROMPT = `You are a fact extraction system. Analyze the conversation and extract structured facts.

For each fact, output a JSON object on its own line with these fields:
- entityId: identifier for the entity this fact is about (person name, brand name, project name, or "user" for the conversation participant)
- entityType: one of "client", "brand", "user", "project"
- category: one of "preference", "decision", "fact", "relationship", "task", "feedback"
- content: the fact as a concise statement
- confidence: 0.0 to 1.0 (how certain this fact is based on the conversation)

Category guidelines:
- preference: likes, dislikes, preferred ways of working, style preferences
- decision: explicit decisions made during the conversation
- fact: objective information stated (names, dates, numbers, technical details)
- relationship: connections between entities (works with, reports to, partnered with)
- task: action items, todos, assignments mentioned
- feedback: opinions, reviews, satisfaction expressed

Output ONLY valid JSON lines, one per fact. No markdown, no extra text. If no facts found, output nothing.

Conversation:
`;

export async function extractFacts(
  messages: { role: string; content: string }[],
  llm: LLMFunction,
  agentId: string
): Promise<Omit<StructuredMemory, "id" | "accessCount" | "lastAccessed" | "createdAt">[]> {
  const conversationText = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const prompt = EXTRACTION_PROMPT + conversationText;
  const response = await llm(prompt);

  const results: Omit<StructuredMemory, "id" | "accessCount" | "lastAccessed" | "createdAt">[] = [];
  const lines = response.split("\n").filter((l) => l.trim().length > 0);

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line.trim()) as ExtractedFact;
      if (!parsed.content || !parsed.category || !parsed.entityType || !parsed.entityId) continue;

      const validCategories: MemoryCategory[] = ["preference", "decision", "fact", "relationship", "task", "feedback"];
      const validEntityTypes: EntityType[] = ["client", "brand", "user", "project"];

      if (!validCategories.includes(parsed.category)) continue;
      if (!validEntityTypes.includes(parsed.entityType)) continue;

      const confidence = Math.max(0, Math.min(1, parsed.confidence ?? 0.5));

      results.push({
        agentId,
        entityId: parsed.entityId,
        entityType: parsed.entityType,
        category: parsed.category,
        content: parsed.content,
        confidence,
        embedding: null,
      });
    } catch {
      // Skip malformed lines
    }
  }

  return results;
}
