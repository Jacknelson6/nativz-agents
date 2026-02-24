import { create } from 'zustand';
import type { Message } from '../lib/types';
import { sendMessage as sendTauriMessage } from '../lib/tauri';

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  sendMessage: (agentId: string, content: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  sendMessage: async (agentId, content) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], isStreaming: true }));
    try {
      const reply = await sendTauriMessage(agentId, content);
      set((s) => ({ messages: [...s.messages, reply], isStreaming: false }));
    } catch {
      set((s) => ({
        messages: [...s.messages, { id: crypto.randomUUID(), role: 'system', content: 'Error: Failed to get response.', timestamp: Date.now() }],
        isStreaming: false,
      }));
    }
  },
  clearMessages: () => set({ messages: [] }),
}));
