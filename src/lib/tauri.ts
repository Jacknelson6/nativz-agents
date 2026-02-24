import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type {
  Agent,
  AppSettings,
  Conversation,
  ConversationSummary,
  CostStats,
  Message,
  Provider,
  StructuredMemory,
  UsageStats,
} from './types';

// --- Agents ---

export async function getAgents(): Promise<Agent[]> {
  return invoke('list_agents');
}

export async function sendMessage(agentId: string, message: string): Promise<Message> {
  const content: string = await invoke('send_message', { agentId, message });
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    timestamp: Date.now(),
  };
}

// --- Settings ---

export async function getSettings(): Promise<AppSettings> {
  return invoke('get_settings');
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return invoke('save_settings', { settings });
}

export async function saveApiKey(key: string): Promise<void> {
  const settings = await getSettings();
  await saveSettings({ ...settings, apiKey: key });
}

// --- Providers ---

export async function listProviders(): Promise<Provider[]> {
  return invoke('list_providers');
}

export async function setProvider(providerId: string, modelId: string): Promise<void> {
  return invoke('set_provider', { providerId, modelId });
}

// --- Conversations ---

export async function listConversations(): Promise<ConversationSummary[]> {
  return invoke('list_conversations');
}

export async function loadConversation(conversationId: string): Promise<Conversation> {
  return invoke('load_conversation', { conversationId });
}

export async function deleteConversation(conversationId: string): Promise<void> {
  return invoke('delete_conversation', { conversationId });
}

export async function getConversations(_agentId: string): Promise<Conversation[]> {
  return [];
}

// --- Memory ---

export async function getMemories(filters?: {
  entityType?: string;
  category?: string;
  search?: string;
}): Promise<StructuredMemory[]> {
  return invoke('get_memories', { filters: filters ?? {} });
}

export async function getWorkingMemory(agentId: string): Promise<string> {
  return invoke('get_working_memory', { agentId });
}

// --- Analytics ---

export async function getUsageStats(): Promise<UsageStats> {
  return invoke('get_usage_stats');
}

export async function getCostStats(): Promise<CostStats> {
  return invoke('get_cost_stats');
}

// --- Streaming ---

export interface StreamEvent {
  requestId: string;
  agentId: string;
  type: 'text_delta' | 'tool_use_start' | 'tool_use_end' | 'message_done';
  text?: string;
  name?: string;
  toolUseId?: string;
  result?: string;
  fullText?: string;
}

export function onAgentStream(callback: (event: StreamEvent) => void) {
  return listen<StreamEvent>('agent-stream', (e) => callback(e.payload));
}

export function onSidecarOutput(callback: (line: string) => void) {
  return listen<string>('sidecar-output', (event) => {
    callback(event.payload);
  });
}
