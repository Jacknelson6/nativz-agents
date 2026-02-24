/**
 * Smart Conversation Titling — Generate concise, descriptive titles from messages.
 */

export interface TitleMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export type LlmCallFn = (prompt: string) => Promise<string>;

const MAX_CONTENT_LENGTH = 500;
const TITLE_MAX_LENGTH = 60;
const REGENERATE_AFTER_TURNS = 5;

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "…";
}

function fallbackTitle(messages: ReadonlyArray<TitleMessage>): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New Conversation";
  // Clean up and truncate
  const cleaned = firstUser.content.replace(/\s+/g, " ").trim();
  return truncate(cleaned, TITLE_MAX_LENGTH);
}

/**
 * Generate a concise, descriptive conversation title.
 * Uses the first 2-3 messages for context; falls back to truncated first message.
 */
export async function generateTitle(
  messages: ReadonlyArray<TitleMessage>,
  llmCall?: LlmCallFn
): Promise<string> {
  if (messages.length === 0) return "New Conversation";

  if (!llmCall) return fallbackTitle(messages);

  const contextMessages = messages
    .filter((m) => m.role !== "system")
    .slice(0, 3)
    .map((m) => `${m.role}: ${truncate(m.content, MAX_CONTENT_LENGTH)}`)
    .join("\n");

  const prompt = [
    "Generate a concise title (max 6 words) for this conversation. Return ONLY the title, no quotes or punctuation at the end.",
    "",
    contextMessages,
  ].join("\n");

  try {
    const raw = await llmCall(prompt);
    const title = raw
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\.+$/, "");
    if (title.length === 0) return fallbackTitle(messages);
    return truncate(title, TITLE_MAX_LENGTH);
  } catch {
    return fallbackTitle(messages);
  }
}

/**
 * Determine whether a conversation title should be regenerated
 * based on the current turn count and previous generation turn.
 */
export function shouldRegenerateTitle(
  totalTurns: number,
  lastGeneratedAtTurn: number
): boolean {
  if (lastGeneratedAtTurn === 0 && totalTurns >= 2) return true;
  if (totalTurns - lastGeneratedAtTurn >= REGENERATE_AFTER_TURNS) return true;
  return false;
}

/**
 * Manages conversation title state with auto-regeneration.
 */
export class ConversationTitleManager {
  private currentTitle: string;
  private lastGeneratedAtTurn: number;
  private turnCount: number;

  constructor(initialTitle?: string) {
    this.currentTitle = initialTitle ?? "New Conversation";
    this.lastGeneratedAtTurn = 0;
    this.turnCount = 0;
  }

  getTitle(): string {
    return this.currentTitle;
  }

  /**
   * Call after each user message. Returns true if the title was updated.
   */
  async onNewMessage(
    messages: ReadonlyArray<TitleMessage>,
    llmCall?: LlmCallFn
  ): Promise<boolean> {
    this.turnCount = messages.filter((m) => m.role === "user").length;

    if (!shouldRegenerateTitle(this.turnCount, this.lastGeneratedAtTurn)) {
      return false;
    }

    const newTitle = await generateTitle(messages, llmCall);
    if (newTitle !== this.currentTitle) {
      this.currentTitle = newTitle;
      this.lastGeneratedAtTurn = this.turnCount;
      return true;
    }
    return false;
  }
}
