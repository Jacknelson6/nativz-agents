import {
  GoogleGenerativeAI,
  type Content,
  type Part,
  type FunctionDeclaration,
  type FunctionDeclarationSchemaProperty,
  type GenerateContentResult,
  SchemaType,
} from "@google/generative-ai";
import type {
  LlmProvider,
  ProviderConfig,
  ProviderHealth,
  ModelInfo,
  UnifiedLlmRequest,
  UnifiedLlmResponse,
  UnifiedStreamCallbacks,
  UnifiedContentBlock,
  UnifiedToolDefinition,
  UnifiedMessage,
} from "./types.js";

const GEMINI_MODELS: ModelInfo[] = [
  {
    id: "gemini-2.5-pro-preview-05-06",
    name: "Gemini 2.5 Pro",
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    inputCostPer1M: 1.25,
    outputCostPer1M: 10,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: "gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash",
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
];

function toGeminiContents(messages: UnifiedMessage[]): Content[] {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const parts: Part[] = [];
      if (typeof m.content === "string") {
        parts.push({ text: m.content });
      } else {
        for (const p of m.content) {
          if (p.type === "text") parts.push({ text: p.text });
        }
      }
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts,
      };
    });
}

function mapSchemaType(typeStr: string): SchemaType {
  switch (typeStr) {
    case "string": return SchemaType.STRING;
    case "number": return SchemaType.NUMBER;
    case "integer": return SchemaType.INTEGER;
    case "boolean": return SchemaType.BOOLEAN;
    case "array": return SchemaType.ARRAY;
    default: return SchemaType.OBJECT;
  }
}

function toGeminiFunctionDeclarations(
  tools: UnifiedToolDefinition[]
): FunctionDeclaration[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: SchemaType.OBJECT,
      properties: Object.fromEntries(
        Object.entries(t.inputSchema.properties).map(([key, val]) => [
          key,
          {
            type: mapSchemaType(val.type),
            description: val.description ?? "",
          } as FunctionDeclarationSchemaProperty,
        ])
      ),
      required: t.inputSchema.required ?? [],
    },
  }));
}

function extractContent(result: GenerateContentResult): {
  content: UnifiedContentBlock[];
  inputTokens: number;
  outputTokens: number;
} {
  const blocks: UnifiedContentBlock[] = [];
  const response = result.response;
  const candidates = response.candidates ?? [];

  for (const candidate of candidates) {
    for (const part of candidate.content?.parts ?? []) {
      if ("text" in part && part.text) {
        blocks.push({ type: "text", text: part.text });
      }
      if ("functionCall" in part && part.functionCall) {
        blocks.push({
          type: "tool_use",
          id: `gemini_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: part.functionCall.name,
          input: (part.functionCall.args ?? {}) as Record<string, unknown>,
        });
      }
    }
  }

  const usage = response.usageMetadata;
  return {
    content: blocks,
    inputTokens: usage?.promptTokenCount ?? 0,
    outputTokens: usage?.candidatesTokenCount ?? 0,
  };
}

export class GeminiProvider implements LlmProvider {
  readonly name = "gemini";
  readonly displayName = "Google Gemini";
  private genai: GoogleGenerativeAI;

  constructor(config?: ProviderConfig) {
    const apiKey = config?.apiKey ?? process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";
    this.genai = new GoogleGenerativeAI(apiKey);
  }

  async call(request: UnifiedLlmRequest): Promise<UnifiedLlmResponse> {
    const start = Date.now();
    const tools = request.tools?.length
      ? [{ functionDeclarations: toGeminiFunctionDeclarations(request.tools) }]
      : undefined;

    const model = this.genai.getGenerativeModel({
      model: request.model,
      systemInstruction: request.system,
      tools,
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 4096,
        temperature: request.temperature,
        stopSequences: request.stopSequences,
      },
    });

    const contents = toGeminiContents(request.messages);
    const result = await model.generateContent({ contents });
    const { content, inputTokens, outputTokens } = extractContent(result);

    const hasToolUse = content.some((b) => b.type === "tool_use");

    return {
      content,
      stopReason: hasToolUse ? "tool_use" : "end_turn",
      usage: { inputTokens, outputTokens },
      model: request.model,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  async streamCall(
    request: UnifiedLlmRequest,
    callbacks?: UnifiedStreamCallbacks
  ): Promise<UnifiedLlmResponse> {
    const start = Date.now();
    const tools = request.tools?.length
      ? [{ functionDeclarations: toGeminiFunctionDeclarations(request.tools) }]
      : undefined;

    const model = this.genai.getGenerativeModel({
      model: request.model,
      systemInstruction: request.system,
      tools,
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 4096,
        temperature: request.temperature,
        stopSequences: request.stopSequences,
      },
    });

    const contents = toGeminiContents(request.messages);
    const result = await model.generateContentStream({ contents });

    let fullText = "";
    const allBlocks: UnifiedContentBlock[] = [];
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullText += text;
        callbacks?.onTextDelta?.(text);
      }
      // Check function calls in chunk
      for (const candidate of chunk.candidates ?? []) {
        for (const part of candidate.content?.parts ?? []) {
          if ("functionCall" in part && part.functionCall) {
            const id = `gemini_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            callbacks?.onToolUseStart?.(part.functionCall.name, id);
            allBlocks.push({
              type: "tool_use",
              id,
              name: part.functionCall.name,
              input: (part.functionCall.args ?? {}) as Record<string, unknown>,
            });
          }
        }
      }
      if (chunk.usageMetadata) {
        inputTokens = chunk.usageMetadata.promptTokenCount ?? 0;
        outputTokens = chunk.usageMetadata.candidatesTokenCount ?? 0;
      }
    }

    callbacks?.onMessageDone?.(fullText);

    if (fullText) {
      allBlocks.unshift({ type: "text", text: fullText });
    }

    const hasToolUse = allBlocks.some((b) => b.type === "tool_use");

    return {
      content: allBlocks,
      stopReason: hasToolUse ? "tool_use" : "end_turn",
      usage: { inputTokens, outputTokens },
      model: request.model,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  async countTokens(text: string, model?: string): Promise<number> {
    try {
      const m = this.genai.getGenerativeModel({ model: model ?? "gemini-2.5-flash-preview-05-20" });
      const result = await m.countTokens(text);
      return result.totalTokens;
    } catch {
      return Math.ceil(text.length / 4);
    }
  }

  listModels(): ModelInfo[] {
    return GEMINI_MODELS;
  }

  async isAvailable(): Promise<boolean> {
    return !!(process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const model = this.genai.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });
      await model.generateContent("hi");
      return { available: true, latencyMs: Date.now() - start, lastChecked: Date.now() };
    } catch (err) {
      return {
        available: false,
        lastChecked: Date.now(),
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
