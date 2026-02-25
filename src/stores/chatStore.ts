import { create } from 'zustand';
import type { Message, ToolCall } from '../lib/types';
import { sendMessage as sendTauriMessage, onAgentStream, loadConversation, listConversations, type StreamEvent } from '../lib/tauri';
import { emitNotification } from '../components/layout/NotificationCenter';

function findToolCallIndex(toolCalls: ToolCall[], event: StreamEvent): number {
  if (event.toolUseId) {
    return toolCalls.findIndex((tc) => tc.toolUseId === event.toolUseId);
  }
  for (let i = toolCalls.length - 1; i >= 0; i--) {
    if (toolCalls[i].name === event.name && toolCalls[i].status === 'running') {
      return i;
    }
  }
  return -1;
}

interface ConversationMeta {
  id: string;
  title: string;
  messageCount: number;
}

export interface ThinkingStep {
  id: string;
  type: 'thinking' | 'tool_call' | 'knowledge' | 'memory' | 'reflection' | 'plan';
  label: string;
  detail?: string;
  status: 'active' | 'done';
  timestamp: number;
}

interface ChatState {
  messagesByAgent: Record<string, Message[]>;
  currentAgentId: string | null;
  currentConversationId: string | null;
  isStreaming: boolean;
  streamingMessageId: string | null;
  messages: Message[];
  thinkingSteps: ThinkingStep[];
  conversationTokens: { input: number; output: number };
  bookmarkedMessages: Set<string>;
  conversationMetaByAgent: Record<string, ConversationMeta[]>;
  setAgent: (agentId: string) => void;
  sendMessage: (agentId: string, content: string) => Promise<void>;
  clearMessages: (agentId?: string) => void;
  loadConversationMessages: (conversationId: string, agentId: string) => Promise<void>;
  hydrateFromBackend: (agentId: string) => Promise<void>;
  toggleBookmark: (messageId: string) => void;
  isBookmarked: (messageId: string) => boolean;
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
    currentConversationId: null,
    isStreaming: false,
    streamingMessageId: null,
    messages: [],
    thinkingSteps: [],
    conversationTokens: { input: 0, output: 0 },
    bookmarkedMessages: new Set(JSON.parse(localStorage.getItem('bookmarks') ?? '[]')),
    conversationMetaByAgent: {},

    toggleBookmark: (messageId: string) => {
      set((s) => {
        const next = new Set(s.bookmarkedMessages);
        if (next.has(messageId)) {
          next.delete(messageId);
        } else {
          next.add(messageId);
        }
        localStorage.setItem('bookmarks', JSON.stringify([...next]));
        return { bookmarkedMessages: next };
      });
    },

    isBookmarked: (messageId: string) => {
      return get().bookmarkedMessages.has(messageId);
    },

    loadConversationMessages: async (conversationId: string, agentId: string) => {
      try {
        const conv = await loadConversation(conversationId);
        if (!conv || !conv.messages) return;

        const messages: Message[] = conv.messages.map((m: { role: string; content: string }, idx: number) => ({
          id: `${conversationId}-${idx}`,
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
          timestamp: conv.createdAt
            ? new Date(conv.createdAt).getTime() + idx * 1000
            : Date.now() - (conv.messages.length - idx) * 1000,
        }));

        set((s) => ({
          messagesByAgent: { ...s.messagesByAgent, [agentId]: messages },
          messages: s.currentAgentId === agentId ? messages : s.messages,
          currentAgentId: agentId,
          currentConversationId: conversationId,
        }));
      } catch {
        // Failed to load — leave messages empty
      }
    },

    hydrateFromBackend: async (agentId: string) => {
      try {
        const summaries = await listConversations(agentId);
        const meta: ConversationMeta[] = summaries.map((s) => ({
          id: s.id,
          title: s.title,
          messageCount: 0,
        }));
        set((s) => ({
          conversationMetaByAgent: { ...s.conversationMetaByAgent, [agentId]: meta },
        }));
      } catch {
        // hydration failed silently
      }
    },

    setAgent: (agentId: string) => {
      const msgs = get().messagesByAgent[agentId] ?? [];
      set({ currentAgentId: agentId, messages: msgs });
    },

    _handleStreamEvent: (event: StreamEvent) => {
      const { streamingMessageId } = get();
      if (!streamingMessageId) return;

      const agentId = event.agentId;
      if (!agentId) return;

      // Update thinking steps based on stream events
      if (event.type === 'tool_use_start' && event.name) {
        const stepType = event.name.startsWith('memory') ? 'memory' as const
          : event.name.startsWith('knowledge') ? 'knowledge' as const
          : 'tool_call' as const;
        set((s) => ({
          thinkingSteps: [...s.thinkingSteps, {
            id: event.toolUseId ?? crypto.randomUUID(),
            type: stepType,
            label: `Running ${event.name}...`,
            status: 'active',
            timestamp: Date.now(),
          }],
        }));
      } else if (event.type === 'tool_use_end') {
        set((s) => ({
          thinkingSteps: s.thinkingSteps.map((step) =>
            (event.toolUseId && step.id === event.toolUseId) ||
            (step.label === `Running ${event.name}...` && step.status === 'active')
              ? { ...step, status: 'done' as const, label: event.name ?? step.label }
              : step
          ),
        }));
      } else if (event.type === 'tool_error') {
        set((s) => ({
          thinkingSteps: s.thinkingSteps.map((step) =>
            (event.toolUseId && step.id === event.toolUseId) ||
            (step.label === `Running ${event.name}...` && step.status === 'active')
              ? { ...step, status: 'done' as const, label: `${event.name ?? step.label} (failed)` }
              : step
          ),
        }));
      }

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
      }

      // Token counting
      if (event.type === 'text_delta' && event.text) {
        set((s) => ({
          conversationTokens: {
            ...s.conversationTokens,
            output: s.conversationTokens.output + Math.ceil(event.text!.length / 4),
          },
        }));
      }
      if (event.type === 'tool_use_end' && event.result) {
        set((s) => ({
          conversationTokens: {
            ...s.conversationTokens,
            input: s.conversationTokens.input + Math.ceil(event.result!.length / 4),
          },
        }));
      }

      if (event.type === 'tool_use_start' && event.name) {
        set((s) => {
          const agentMsgs = [...(s.messagesByAgent[agentId] ?? [])];
          const idx = agentMsgs.findIndex((m) => m.id === streamingMessageId);
          if (idx === -1) return s;
          const msg = agentMsgs[idx];
          const toolCalls = [...(msg.toolCalls ?? []), { name: event.name!, status: 'running' as const, input: {}, toolUseId: event.toolUseId }];
          agentMsgs[idx] = { ...msg, toolCalls };
          return {
            messagesByAgent: { ...s.messagesByAgent, [agentId]: agentMsgs },
            messages: s.currentAgentId === agentId ? agentMsgs : s.messages,
          };
        });
      } else if (event.type === 'tool_use_end' && event.name) {
        set((s) => {
          const agentMsgs = [...(s.messagesByAgent[agentId] ?? [])];
          const idx = agentMsgs.findIndex((m) => m.id === streamingMessageId);
          if (idx === -1) return s;
          const msg = agentMsgs[idx];
          const toolCalls = [...(msg.toolCalls ?? [])];
          let tcIdx = findToolCallIndex(toolCalls, event);
          if (tcIdx !== -1) {
            toolCalls[tcIdx] = { ...toolCalls[tcIdx], status: 'completed', output: event.result };
          }
          agentMsgs[idx] = { ...msg, toolCalls };
          return {
            messagesByAgent: { ...s.messagesByAgent, [agentId]: agentMsgs },
            messages: s.currentAgentId === agentId ? agentMsgs : s.messages,
          };
        });
      } else if (event.type === 'tool_error') {
        set((s) => {
          const agentMsgs = [...(s.messagesByAgent[agentId] ?? [])];
          const idx = agentMsgs.findIndex((m) => m.id === streamingMessageId);
          if (idx === -1) return s;
          const msg = agentMsgs[idx];
          const toolCalls = [...(msg.toolCalls ?? [])];
          let tcIdx = findToolCallIndex(toolCalls, event);
          if (tcIdx !== -1) {
            toolCalls[tcIdx] = { ...toolCalls[tcIdx], status: 'error', output: event.error ?? 'Tool execution failed' };
          }
          agentMsgs[idx] = { ...msg, toolCalls };
          return {
            messagesByAgent: { ...s.messagesByAgent, [agentId]: agentMsgs },
            messages: s.currentAgentId === agentId ? agentMsgs : s.messages,
          };
        });
      }
    },

    sendMessage: async (agentId: string, content: string) => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

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
          thinkingSteps: [],
        };
      });

      try {
        const reply = await sendTauriMessage(agentId, content);
        set((s) => {
          const agentMsgs = [...(s.messagesByAgent[agentId] ?? [])];
          const idx = agentMsgs.findIndex((m) => m.id === assistantMsg.id);
          if (idx !== -1) {
            const streamedContent = agentMsgs[idx].content;
            agentMsgs[idx] = {
              ...agentMsgs[idx],
              content: (streamedContent || reply.content || 'No response received.').trim(),
              timestamp: Date.now(),
            };
          }
          return {
            messagesByAgent: { ...s.messagesByAgent, [agentId]: agentMsgs },
            messages: s.currentAgentId === agentId ? agentMsgs : s.messages,
            isStreaming: false,
            streamingMessageId: null,
            thinkingSteps: [],
          };
        });
      } catch (err) {
        let errorMessage = 'Failed to get response.';
        if (err instanceof Error) {
          const msg = err.message;
          const tauriMatch = msg.match(/returned error:\s*(.+)/i);
          errorMessage = tauriMatch ? tauriMatch[1].trim() : msg;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        set((s) => {
          const agentMsgs = [...(s.messagesByAgent[agentId] ?? [])];
          const idx = agentMsgs.findIndex((m) => m.id === assistantMsg.id);
          if (idx !== -1) {
            agentMsgs[idx] = {
              ...agentMsgs[idx],
              role: 'system',
              content: `Error: ${errorMessage}`,
            };
          }
          return {
            messagesByAgent: { ...s.messagesByAgent, [agentId]: agentMsgs },
            messages: s.currentAgentId === agentId ? agentMsgs : s.messages,
            isStreaming: false,
            streamingMessageId: null,
            thinkingSteps: [],
          };
        });
        emitNotification({
          type: 'error',
          title: 'Message Failed',
          message: errorMessage,
        });
      }
    },

    clearMessages: (agentId?: string) => {
      if (agentId) {
        set((s) => {
          const updated = { ...s.messagesByAgent };
          delete updated[agentId];
          return {
            messagesByAgent: updated,
            messages: s.currentAgentId === agentId ? [] : s.messages,
            conversationTokens: { input: 0, output: 0 },
          };
        });
      } else {
        set({ messagesByAgent: {}, messages: [], currentConversationId: null, conversationTokens: { input: 0, output: 0 } });
      }
    },
  };
});