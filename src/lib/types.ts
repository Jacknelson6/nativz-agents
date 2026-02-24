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
