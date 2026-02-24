export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export type RpcHandler = (params: Record<string, unknown>) => Promise<unknown>;

// ─── New RPC parameter/result types ───

export interface ListConversationsParams {
  agentId: string;
  limit?: number;
  offset?: number;
}

export interface ListConversationsResult {
  conversations: Array<{
    id: string;
    agentId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
  }>;
}

export interface LoadConversationParams {
  conversationId: string;
}

export interface LoadConversationResult {
  conversation: {
    id: string;
    agentId: string;
    title: string;
    messages: Array<{ role: string; content: string }>;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface DeleteConversationParams {
  conversationId: string;
}

export interface GetMemoriesParams {
  agentId: string;
  entityId: string;
  entityType: string;
}

export interface GetMemoriesResult {
  memories: Array<{
    id: string;
    entityId: string;
    entityType: string;
    category: string;
    content: string;
    confidence: number;
    createdAt: string;
  }>;
}

export interface SetProviderParams {
  agentId: string;
  providerId: string;
}

export interface ListProvidersResult {
  providers: Array<{
    name: string;
    displayName: string;
    available: boolean;
    models: Array<{ id: string; name: string }>;
  }>;
}

export interface UsageStatsResult {
  daily: { inputTokens: number; outputTokens: number; totalTokens: number };
  monthly: { inputTokens: number; outputTokens: number; totalTokens: number };
  byAgent: Array<{ group: string; inputTokens: number; outputTokens: number; totalTokens: number }>;
  byModel: Array<{ group: string; inputTokens: number; outputTokens: number; totalTokens: number }>;
}

export interface CostStatsResult {
  todayCost: number;
  monthCost: number;
  dailyLimit: number;
  monthlyLimit: number;
  withinBudget: boolean;
  totalConversations: number;
}

export interface GetWorkingMemoryParams {
  agentId: string;
}

export interface GetWorkingMemoryResult {
  entries: Record<string, string>;
}
