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

export async function listProviders(agentId?: string): Promise<Provider[]> {
  const result = await invoke<{ providers: Provider[] } | Provider[]>('list_providers', { agentId: agentId ?? '' });
  // Backend wraps in { providers: [...] } — unwrap if needed
  if (result && !Array.isArray(result) && Array.isArray((result as { providers: Provider[] }).providers)) {
    return (result as { providers: Provider[] }).providers;
  }
  return (result as Provider[]) ?? [];
}

export async function setProvider(agentId: string, providerId: string): Promise<void> {
  return invoke('set_provider', { agentId, providerId });
}

// --- Conversations ---

export async function listConversations(agentId?: string): Promise<ConversationSummary[]> {
  return invoke('list_conversations', { agentId: agentId ?? '' });
}

export async function loadConversation(conversationId: string): Promise<Conversation> {
  return invoke('load_conversation', { conversationId });
}

export async function deleteConversation(conversationId: string): Promise<void> {
  return invoke('delete_conversation', { conversationId });
}

export async function renameConversation(conversationId: string, title: string): Promise<void> {
  return invoke('rename_conversation', { conversationId, title });
}

export async function getConversations(_agentId: string): Promise<Conversation[]> {
  return [];
}

// --- Memory ---

export async function getMemories(agentId: string, entityId?: string, entityType?: string): Promise<StructuredMemory[]> {
  const params: Record<string, string> = { agentId };
  if (entityId) {
    params.entityId = entityId;
    params.entityType = entityType ?? 'user';
  }
  return invoke('get_memories', params);
}

export async function updateMemory(agentId: string, memoryId: string, content: string, confidence?: number): Promise<void> {
  return invoke('update_memory', { agentId, memoryId, content, confidence });
}

export async function deleteMemory(agentId: string, memoryId: string): Promise<void> {
  return invoke('delete_memory', { agentId, memoryId });
}

export async function getWorkingMemory(agentId: string): Promise<Record<string, unknown>> {
  return invoke('get_working_memory', { agentId });
}

// --- Analytics ---

export async function getUsageStats(agentId?: string): Promise<UsageStats> {
  return invoke('get_usage_stats', { agentId: agentId ?? '' });
}

export async function getCostStats(agentId?: string): Promise<CostStats> {
  return invoke('get_cost_stats', { agentId });
}

// --- Streaming ---

export interface StreamEvent {
  requestId: string;
  agentId: string;
  type: 'text_delta' | 'tool_use_start' | 'tool_use_end' | 'tool_error' | 'message_done';
  text?: string;
  name?: string;
  toolUseId?: string;
  result?: string;
  fullText?: string;
  error?: string;
}

export function onAgentStream(callback: (event: StreamEvent) => void) {
  return listen<StreamEvent>('agent-stream', (e) => callback(e.payload));
}

export function onSidecarOutput(callback: (line: string) => void) {
  return listen<string>('sidecar-output', (event) => {
    callback(event.payload);
  });
}

// --- Knowledge ---

export interface KnowledgeFileInfo {
  name: string;
  path: string;
  sizeBytes: number;
  modifiedAt: string;
}

export interface KnowledgeFileContent {
  content: string;
}

export async function listKnowledgeFiles(agentId: string): Promise<KnowledgeFileInfo[]> {
  return invoke('list_knowledge_files', { agentId });
}

export async function readKnowledgeFile(agentId: string, filePath: string): Promise<KnowledgeFileContent> {
  return invoke('read_knowledge_file', { agentId, filePath });
}

// --- System Prompt ---

export interface SystemPromptResult {
  prompt: string;
  defaultPrompt: string;
  isCustom: boolean;
}

export async function getSystemPrompt(agentId: string): Promise<SystemPromptResult> {
  return invoke('get_system_prompt', { agentId });
}

export async function setSystemPrompt(agentId: string, prompt: string): Promise<void> {
  return invoke('set_system_prompt', { agentId, prompt });
}
