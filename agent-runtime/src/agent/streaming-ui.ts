/**
 * Rich Streaming UI Events — typed event system for real-time frontend updates.
 */

export type StreamEventType =
  | "thinking_start"
  | "thinking_end"
  | "text_delta"
  | "tool_call_start"
  | "tool_call_result"
  | "knowledge_retrieved"
  | "memory_updated"
  | "plan_step_start"
  | "plan_step_complete"
  | "reflection_start"
  | "reflection_result"
  | "message_done";

export interface StreamEvent {
  type: StreamEventType;
  timestamp: number;
  data: StreamEventData;
}

export type StreamEventData =
  | ThinkingStartData
  | ThinkingEndData
  | TextDeltaData
  | ToolCallStartData
  | ToolCallResultData
  | KnowledgeRetrievedData
  | MemoryUpdatedData
  | PlanStepStartData
  | PlanStepCompleteData
  | ReflectionStartData
  | ReflectionResultData
  | MessageDoneData;

export interface ThinkingStartData {
  kind: "thinking_start";
}

export interface ThinkingEndData {
  kind: "thinking_end";
  durationMs: number;
}

export interface TextDeltaData {
  kind: "text_delta";
  text: string;
}

export interface ToolCallStartData {
  kind: "tool_call_start";
  toolName: string;
  toolId: string;
  input: Record<string, unknown>;
}

export interface ToolCallResultData {
  kind: "tool_call_result";
  toolName: string;
  toolId: string;
  result: string;
  success: boolean;
}

export interface KnowledgeRetrievedData {
  kind: "knowledge_retrieved";
  query: string;
  results: Array<{ title: string; score: number; snippet: string }>;
}

export interface MemoryUpdatedData {
  kind: "memory_updated";
  facts: Array<{ entity: string; content: string; category: string }>;
}

export interface PlanStepStartData {
  kind: "plan_step_start";
  stepId: string;
  description: string;
  tools: string[];
}

export interface PlanStepCompleteData {
  kind: "plan_step_complete";
  stepId: string;
  status: "completed" | "failed" | "skipped";
  result?: string;
  error?: string;
}

export interface ReflectionStartData {
  kind: "reflection_start";
  complexityScore: number;
}

export interface ReflectionResultData {
  kind: "reflection_result";
  shouldRevise: boolean;
  critique: string;
}

export interface MessageDoneData {
  kind: "message_done";
  fullText: string;
}

type EventListener = (event: StreamEvent) => void;

export class StreamingUIManager {
  private listeners: EventListener[] = [];
  private eventLog: StreamEvent[] = [];
  private thinkingStartTime: number | null = null;

  onEvent(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private emit(type: StreamEventType, data: StreamEventData): void {
    const event: StreamEvent = {
      type,
      timestamp: Date.now(),
      data,
    };
    this.eventLog.push(event);
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  thinkingStart(): void {
    this.thinkingStartTime = Date.now();
    this.emit("thinking_start", { kind: "thinking_start" });
  }

  thinkingEnd(): void {
    const durationMs = this.thinkingStartTime ? Date.now() - this.thinkingStartTime : 0;
    this.thinkingStartTime = null;
    this.emit("thinking_end", { kind: "thinking_end", durationMs });
  }

  textDelta(text: string): void {
    this.emit("text_delta", { kind: "text_delta", text });
  }

  toolCallStart(toolName: string, toolId: string, input: Record<string, unknown>): void {
    this.emit("tool_call_start", { kind: "tool_call_start", toolName, toolId, input });
  }

  toolCallResult(toolName: string, toolId: string, result: string, success: boolean): void {
    this.emit("tool_call_result", { kind: "tool_call_result", toolName, toolId, result, success });
  }

  knowledgeRetrieved(query: string, results: Array<{ title: string; score: number; snippet: string }>): void {
    this.emit("knowledge_retrieved", { kind: "knowledge_retrieved", query, results });
  }

  memoryUpdated(facts: Array<{ entity: string; content: string; category: string }>): void {
    this.emit("memory_updated", { kind: "memory_updated", facts });
  }

  planStepStart(stepId: string, description: string, tools: string[]): void {
    this.emit("plan_step_start", { kind: "plan_step_start", stepId, description, tools });
  }

  planStepComplete(stepId: string, status: "completed" | "failed" | "skipped", result?: string, error?: string): void {
    this.emit("plan_step_complete", { kind: "plan_step_complete", stepId, status, result, error });
  }

  reflectionStart(complexityScore: number): void {
    this.emit("reflection_start", { kind: "reflection_start", complexityScore });
  }

  reflectionResult(shouldRevise: boolean, critique: string): void {
    this.emit("reflection_result", { kind: "reflection_result", shouldRevise, critique });
  }

  messageDone(fullText: string): void {
    this.emit("message_done", { kind: "message_done", fullText });
  }

  getEventLog(): ReadonlyArray<StreamEvent> {
    return this.eventLog;
  }

  clearLog(): void {
    this.eventLog = [];
  }
}
