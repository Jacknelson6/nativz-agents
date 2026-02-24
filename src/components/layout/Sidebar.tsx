import { useState, useEffect } from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { useAppStore } from '../../stores/appStore';
import { useChatStore } from '../../stores/chatStore';
import { listConversations, deleteConversation as deleteTauriConv, loadConversation } from '../../lib/tauri';
import type { ConversationSummary } from '../../lib/types';
import { Settings, Home, Plus, MessageSquare, Trash2, BarChart3, BookOpen, Store } from 'lucide-react';

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

  const navItems = [
    { view: 'home' as const, icon: Home, label: 'Home' },
    { view: 'analytics' as const, icon: BarChart3, label: 'Analytics' },
    { view: 'knowledge' as const, icon: BookOpen, label: 'Knowledge' },
    { view: 'marketplace' as const, icon: Store, label: 'Marketplace' },
  ];

  return (
    <div className="w-[260px] h-screen bg-zinc-900 flex flex-col select-none">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <h1 className="text-[15px] font-semibold tracking-tight text-zinc-100">Nativz Agents</h1>
        <p className="text-[11px] text-zinc-500 mt-0.5">AI-powered agency tools</p>
      </div>

      {/* New Chat */}
      <div className="px-3 pb-1">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 transition-colors duration-150"
        >
          <Plus size={15} strokeWidth={2.5} /> New Chat
        </button>
      </div>

      {/* Nav */}
      <div className="px-3 py-1 space-y-0.5">
        {navItems.map(({ view, icon: Icon, label }) => {
          const isActive = currentView === view;
          return (
            <button
              key={view}
              onClick={() => { if (view === 'home') selectAgent(null); setView(view); }}
              className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-colors duration-150 ${
                isActive
                  ? 'text-zinc-100 bg-zinc-800/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Agents */}
      <div className="px-3 mt-3">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium px-3 py-2">Agents</p>
        <div className="space-y-0.5">
          {agents.map((agent) => {
            const isActive = selectedAgent?.id === agent.id && currentView === 'chat';
            return (
              <button
                key={agent.id}
                onClick={() => { selectAgent(agent); setView('chat'); clearMessages(); }}
                className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-colors duration-150 ${
                  isActive
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <span className="text-sm flex-shrink-0">{agent.icon}</span>
                <span className="truncate">{agent.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3 mt-3">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium px-3 py-2">Recent</p>
        {conversations.length === 0 ? (
          <p className="text-[11px] text-zinc-600 px-3 py-1.5">No conversations yet</p>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="group flex items-center gap-2 px-3 py-[7px] rounded-lg hover:bg-zinc-800/40 transition-colors duration-150 cursor-pointer"
                onClick={() => handleResumeConversation(conv)}
              >
                <MessageSquare size={12} className="text-zinc-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-zinc-300 truncate">{conv.title}</p>
                  <p className="text-[10px] text-zinc-600">{formatTime(conv.updatedAt)}</p>
                </div>
                {deleteConfirm === conv.id ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                    className="text-[9px] text-red-400 font-medium px-1.5 py-0.5 rounded bg-red-500/10"
                  >
                    delete?
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(conv.id); }}
                    className="p-0.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-150"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-zinc-800/50">
        <button
          onClick={toggleSettings}
          className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors duration-150"
        >
          <Settings size={15} strokeWidth={1.5} /> Settings
        </button>
      </div>
    </div>
  );
}
