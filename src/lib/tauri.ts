import type { Agent, AppSettings, Conversation, Message } from './types';

// Mock data - swap with real Tauri invoke() calls in Phase 2
const MOCK_AGENTS: Agent[] = [
  { id: 'content-editor', name: 'Content Editor', description: 'Edit and refine content for social media, blogs, and marketing materials.', icon: '✏️', category: 'content' },
  { id: 'seo', name: 'SEO Strategist', description: 'Optimize content for search engines with keyword research and technical SEO.', icon: '🔍', category: 'marketing' },
  { id: 'ads', name: 'Paid Media', description: 'Create and manage ad campaigns across Google, Meta, and TikTok.', icon: '📢', category: 'marketing' },
  { id: 'account-manager', name: 'Account Manager', description: 'Track client deliverables, deadlines, and communication.', icon: '📋', category: 'operations' },
  { id: 'diy', name: 'DIY Assistant', description: 'General-purpose agent for custom tasks and workflows.', icon: '🛠️', category: 'utility' },
];

const MOCK_SETTINGS: AppSettings = {
  apiKey: '',
  role: 'admin',
  theme: 'dark',
  onboardingComplete: false,
};

let settings = { ...MOCK_SETTINGS };

export async function getAgents(): Promise<Agent[]> {
  return MOCK_AGENTS;
}

export async function sendMessage(agentId: string, message: string): Promise<Message> {
  // Simulate delay
  await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: `I'm the **${agentId}** agent. You said: "${message}"\n\nThis is a mock response. In Phase 2, I'll be powered by Claude via the sidecar runtime.`,
    timestamp: Date.now(),
  };
}

export async function getConversations(_agentId: string): Promise<Conversation[]> {
  return [];
}

export async function saveApiKey(key: string): Promise<void> {
  settings.apiKey = key;
}

export async function getSettings(): Promise<AppSettings> {
  return { ...settings };
}

export async function saveSettings(s: Partial<AppSettings>): Promise<void> {
  settings = { ...settings, ...s };
}
