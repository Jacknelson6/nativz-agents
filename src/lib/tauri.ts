import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { Agent, AppSettings, Conversation, Message } from './types';

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

export async function getConversations(_agentId: string): Promise<Conversation[]> {
  return [];
}

export async function saveApiKey(key: string): Promise<void> {
  const settings = await getSettings();
  await saveSettings({ ...settings, apiKey: key });
}

export async function getSettings(): Promise<AppSettings> {
  return invoke('get_settings');
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return invoke('save_settings', { settings });
}

export function onStreamChunk(callback: (chunk: string) => void) {
  return listen<string>('agent-stream-chunk', (event) => {
    callback(event.payload);
  });
}

export function onSidecarOutput(callback: (line: string) => void) {
  return listen<string>('sidecar-output', (event) => {
    callback(event.payload);
  });
}
