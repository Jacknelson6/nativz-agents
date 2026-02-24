import { create } from 'zustand';
import type { Message } from '../lib/types';
import { sendMessage as sendTauriMessage, onAgentStream, type StreamEvent } from '../lib/tauri';

interface ChatState {
  messagesByAgent: Record<string, Message[]>;
  currentAgentId: string | null;
  isStreaming: boolean;
  streamingMessageId: string | null;
  messages: Message[];
  setAgent: (agentId: string) => void;
  sendMessage: (agentId: string, content: string) => Promise<void>;
  clearMessages: (agentId?: string) => void;
  _handleStreamEvent: (event: StreamEvent) => void;
}

// Set up stream listener once
let streamListenerSetup = false;

export const useChatStore = create<ChatState>((set, get) => {
  // Set up the stream event listener on first store creation
  if (!streamListenerSetup) {
    streamListenerSetup = true;
    onAgentStream((event) => {
      get()._handleStreamEvent(event);
    });
  }

  return {
    messagesByAgent: {},
    currentAgentId: null,
    isStreaming: false,
    streamingMessageId: null,
    messages: [],

    setAgent: (agentId) => {
      const msgs = get().messagesByAgent[agentId] ?? [];
      set({ currentAgentId: agentId, messages: msgs });
    },

    _handleStreamEvent: (event: StreamEvent) => {
      const { streamingMessageId } = get();
      if (!streamingMessageId) return;

      const agentId = event.agentId;
      if (!agentId) return;

      if (event.type === 'text_delta' && event.text) {
        set((s) => {
          const agentMsgs = [...(s.messagesByAgent[agentId] ?? [])];
          const idx = agentMsgs.findIndex((m) => m.id === streamingMessageId);
          if (idx === -1) return s;
          agentMsgs[idx] = { ...agentMsgs[idx], content: agentMsgs[idx].content + event.text };
          return {
            messagesByAgent: { ...s.messagesByAgent, [agentId]: agentMsgs },
            messages: s.currentAgentId === agentId ? agentMsgs : s.messages,
          };
        });
      } else if (event.type === 'tool_use_start' && event.name) {
        set((s) => {
          const agentMsgs = [...(s.messagesByAgent[agentId] ?? [])];
          const idx = agentMsgs.findIndex((m) => m.id === streamingMessageId);
          if (idx === -1) return s;
          const msg = agentMsgs[idx];
          const toolCalls = [...(msg.toolCalls ?? []), { name: event.name!, status: 'running' as const, input: {} }];
          agentMsgs[idx] = { ...msg, toolCalls };
          return {
            messagesByAgent: { ...s.messagesByAgent, [agentId]: agentMsgs },
            messages: s.currentAgentId === agentId ? agentMsgs : s.messages,
          };
        });
      }
      // message_done is handled when the invoke() resolves
    },

    sendMessage: async (agentId, content) => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      // Create placeholder assistant message for streaming
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      set((s) => {
        const agentMsgs = [...(s.messagesByAgent[agentId] ?? []), userMsg, assistantMsg];
        return {
          messagesByAgent: { ...s.messagesByAgent, [agentId]: agentMsgs },
          messages: agentMsgs,
          isStreaming: true,
          streamingMessageId: assistantMsg.id,
        };
      });

      try {
        const reply = await sendTauriMessage(agentId, content);
        // Finalize: replace streaming message content with final response
        set((s) => {
          const agentMsgs = [...(s.messagesByAgent[agentId] ?? [])];
          const idx = agentMsgs.findIndex((m) => m.id === assistantMsg.id);
          if (idx !== -1) {
            // Use streamed content if we got some, otherwise use the RPC response
            const streamedContent = agentMsgs[idx].content;
            agentMsgs[idx] = {
              ...agentMsgs[idx],
              content: streamedContent || reply.content,
              timestamp: Date.now(),
            };
          }
          return {
            messagesByAgent: { ...s.messagesByAgent, [agentId]: agentMsgs },
            messages: s.currentAgentId === agentId ? agentMsgs : s.messages,
            isStreaming: false,
            streamingMessageId: null,
          };
        });
      } catch (err) {
        // Replace placeholder with error
        set((s) => {
          const agentMsgs = [...(s.messagesByAgent[agentId] ?? [])];
          const idx = agentMsgs.findIndex((m) => m.id === assistantMsg.id);
          if (idx !== -1) {
            agentMsgs[idx] = {
              ...agentMsgs[idx],
              role: 'system',
              content: err instanceof Error ? err.message : 'Error: Failed to get response.',
            };
          }
          return {
            messagesByAgent: { ...s.messagesByAgent, [agentId]: agentMsgs },
            messages: s.currentAgentId === agentId ? agentMsgs : s.messages,
            isStreaming: false,
            streamingMessageId: null,
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
  };
});
