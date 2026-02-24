export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  name: string;
  status: 'running' | 'completed' | 'error';
  input: Record<string, unknown>;
  output?: string;
}

export interface AppSettings {
  apiKey: string;
  role: 'admin' | 'editor' | 'paid-media' | 'account-manager' | 'developer';
  theme: 'dark' | 'light';
  onboardingComplete: boolean;
}

export interface Conversation {
  id: string;
  agentId: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// --- Provider / Model types ---

export interface ProviderHealth {
  status: 'healthy' | 'degraded' | 'down';
  latencyMs?: number;
  lastChecked: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  costPerInputToken?: number;
  costPerOutputToken?: number;
}

export interface Provider {
  id: string;
  name: string;
  models: ModelInfo[];
  health: ProviderHealth;
  isSubscription: boolean;
  estimatedCostPerMessage?: number;
}

// --- Conversation summary ---

export interface ConversationSummary {
  id: string;
  title: string;
  agentId: string;
  updatedAt: number;
}

// --- Memory types ---

export type MemoryCategory =
  | 'preference'
  | 'decision'
  | 'fact'
  | 'relationship'
  | 'goal'
  | 'feedback'
  | 'context';

export type MemoryEntityType = 'client' | 'brand' | 'user';

export interface StructuredMemory {
  id: string;
  entity: string;
  entityType: MemoryEntityType;
  category: MemoryCategory;
  content: string;
  confidence: number;
  createdAt: number;
  updatedAt: number;
}

// --- Analytics types ---

export interface UsageStats {
  daily: DailyUsage[];
  byAgent: Record<string, number>;
  byModel: Record<string, number>;
  byProvider: Record<string, number>;
  totalTokens: number;
}

export interface DailyUsage {
  date: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostStats {
  dailyCost: Record<string, number>;
  monthlyCost: number;
  totalCost: number;
  subscriptionSavings: number;
  byProvider: Record<string, number>;
}
