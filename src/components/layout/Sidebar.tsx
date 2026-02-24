import { useState, useEffect } from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { useAppStore } from '../../stores/appStore';
import { useChatStore } from '../../stores/chatStore';
import { listConversations, deleteConversation as deleteTauriConv, loadConversation } from '../../lib/tauri';
import type { ConversationSummary } from '../../lib/types';
import { Settings, Home, Plus, MessageSquare, Trash2, BarChart3 } from 'lucide-react';

export default function Sidebar() {
  const { agents, selectedAgent, selectAgent } = useAgentStore();
  const { setView, toggleSettings, currentView } = useAppStore();
  const { clearMessages } = useChatStore();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const convs = await listConversations();
      setConversations(convs);
    } catch {
      setConversations([]);
    }
  };

  const handleNewChat = () => {
    selectAgent(null);
    clearMessages();
    setView('home');
  };

  const handleResumeConversation = async (conv: ConversationSummary) => {
    try {
      const full = await loadConversation(conv.id);
      const agent = agents.find((a) => a.id === conv.agentId);
      if (agent) selectAgent(agent);
      // Load messages into chat store
      useChatStore.setState((s) => ({
        messagesByAgent: { ...s.messagesByAgent, [conv.agentId]: full.messages },
        messages: full.messages,
        currentAgentId: conv.agentId,
      }));
      setView('chat');
    } catch {
      // ignore
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteTauriConv(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
    setDeleteConfirm(null);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-60 h-screen bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold tracking-tight">Nativz Agents</h1>
        <p className="text-xs text-muted mt-0.5">AI-powered agency tools</p>
      </div>

      {/* New Chat + Nav */}
      <div className="p-2 space-y-0.5">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-accent/10 text-accent hover:bg-accent/20 transition-colors font-medium"
        >
          <Plus size={16} /> New Chat
        </button>
        <button
          onClick={() => { selectAgent(null); setView('home'); }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentView === 'home' ? 'text-white bg-white/5' : 'text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Home size={16} /> Home
        </button>
        <button
          onClick={() => setView('analytics')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentView === 'analytics' ? 'text-white bg-white/5' : 'text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 size={16} /> Analytics
        </button>
      </div>

      {/* Agent list */}
      <div className="px-2 pb-1">
        <p className="text-[11px] uppercase tracking-wider text-muted px-3 py-2">Agents</p>
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => { selectAgent(agent); setView('chat'); clearMessages(); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedAgent?.id === agent.id && currentView === 'chat'
                ? 'bg-accent/10 text-accent'
                : 'text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-base">{agent.icon}</span>
            <span className="truncate">{agent.name}</span>
          </button>
        ))}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2">
        <p className="text-[11px] uppercase tracking-wider text-muted px-3 py-2">Recent Chats</p>
        {conversations.length === 0 ? (
          <p className="text-[11px] text-muted px-3 py-1">No conversations yet</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className="group flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => handleResumeConversation(conv)}
            >
              <MessageSquare size={13} className="text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{conv.title}</p>
                <p className="text-[10px] text-muted">{formatTime(conv.updatedAt)}</p>
              </div>
              {deleteConfirm === conv.id ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                  className="text-[9px] text-error font-medium px-1"
                >
                  delete?
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(conv.id); }}
                  className="p-0.5 text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom nav */}
      <div className="p-2 border-t border-border space-y-0.5">
        <button
          onClick={toggleSettings}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-white hover:bg-white/5 transition-colors"
        >
          <Settings size={16} /> Settings
        </button>
      </div>
    </div>
  );
}
