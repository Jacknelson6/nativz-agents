import { create } from 'zustand';
import type { Message } from '../lib/types';
import { sendMessage as sendTauriMessage } from '../lib/tauri';

interface ChatState {
  messagesByAgent: Record<string, Message[]>;
  currentAgentId: string | null;
  isStreaming: boolean;
  messages: Message[];
  setAgent: (agentId: string) => void;
  sendMessage: (agentId: string, content: string) => Promise<void>;
  clearMessages: (agentId?: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesByAgent: {},
  currentAgentId: null,
  isStreaming: false,
  messages: [],

  setAgent: (agentId) => {
    const msgs = get().messagesByAgent[agentId] ?? [];
    set({ currentAgentId: agentId, messages: msgs });
  },

  sendMessage: async (agentId, content) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    set((s) => {
      const agentMsgs = [...(s.messagesByAgent[agentId] ?? []), userMsg];
      return {
        messagesByAgent: { ...s.messagesByAgent, [agentId]: agentMsgs },
        messages: agentMsgs,
        isStreaming: true,
      };
    });
    try {
      const reply = await sendTauriMessage(agentId, content);
      set((s) => {
        const agentMsgs = [...(s.messagesByAgent[agentId] ?? []), reply];
        return {
          messagesByAgent: { ...s.messagesByAgent, [agentId]: agentMsgs },
          messages: agentMsgs,
          isStreaming: false,
        };
      });
    } catch (err) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: err instanceof Error ? err.message : 'Error: Failed to get response.',
        timestamp: Date.now(),
      };
      set((s) => {
        const agentMsgs = [...(s.messagesByAgent[agentId] ?? []), errorMsg];
        return {
          messagesByAgent: { ...s.messagesByAgent, [agentId]: agentMsgs },
          messages: agentMsgs,
          isStreaming: false,
        };
      });
    }
  },

  clearMessages: (agentId) => {
    if (agentId) {
      set((s) => {
        const updated = { ...s.messagesByAgent };
        delete updated[agentId];
        return {
          messagesByAgent: updated,
          messages: s.currentAgentId === agentId ? [] : s.messages,
        };
      });
    } else {
      set({ messagesByAgent: {}, messages: [] });
    }
  },
}));
