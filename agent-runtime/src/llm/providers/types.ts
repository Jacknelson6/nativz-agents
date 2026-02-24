/**
 * Unified LLM Provider types — normalized across all providers.
 */

// ─── Content Blocks (mirrors Anthropic shape for backward compat) ───

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type UnifiedContentBlock = TextBlock | ToolUseBlock;

// ─── Tool Definition (provider-agnostic) ───

export interface ToolParameterProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: ToolParameterProperty;
  properties?: Record<string, ToolParameterProperty>;
  required?: string[];
}

export interface UnifiedToolDefinition {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties: Record<string, ToolParameterProperty>;
    required?: string[];
  };
}

// ─── Messages ───

export interface UnifiedTextContent {
  type: "text";
  text: string;
}

export interface UnifiedImageContent {
  type: "image";
  source: {
    type: "base64" | "url";
    mediaType?: string;
    data?: string;
    url?: string;
  };
}

export type UnifiedContentPart = UnifiedTextContent | UnifiedImageContent;

export interface UnifiedMessage {
  role: "user" | "assistant" | "system";
  content: string | UnifiedContentPart[];
}

// ─── Request / Response ───

export interface UnifiedLlmRequest {
  model: string;
  system: string;
  messages: UnifiedMessage[];
  tools?: UnifiedToolDefinition[];
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

export interface UnifiedLlmResponse {
  content: UnifiedContentBlock[];
  stopReason: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
  provider: string;
  latencyMs: number;
}

// ─── Stream Callbacks ───

export interface UnifiedStreamCallbacks {
  onTextDelta?: (text: string) => void;
  onToolUseStart?: (name: string, id: string) => void;
  onMessageDone?: (fullText: string) => void;
}

// ─── Provider Interface ───

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  maxRetries?: number;
  timeoutMs?: number;
  metadata?: Record<string, string>;
}

export interface ProviderHealth {
  available: boolean;
  latencyMs?: number;
  lastChecked: number;
  error?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  maxOutputTokens: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  supportsTools: boolean;
  supportsStreaming: boolean;
  supportsVision: boolean;
}

export interface LlmProvider {
  readonly name: string;
  readonly displayName: string;

  call(request: UnifiedLlmRequest): Promise<UnifiedLlmResponse>;
  streamCall(
    request: UnifiedLlmRequest,
    callbacks?: UnifiedStreamCallbacks
  ): Promise<UnifiedLlmResponse>;
  countTokens(text: string, model?: string): Promise<number>;
  listModels(): ModelInfo[];
  isAvailable(): Promise<boolean>;
  healthCheck(): Promise<ProviderHealth>;
}
