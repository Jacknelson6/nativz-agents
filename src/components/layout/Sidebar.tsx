import { useAgentStore } from '../../stores/agentStore';
import { useAppStore } from '../../stores/appStore';
import { useChatStore } from '../../stores/chatStore';
import { Settings, Home } from 'lucide-react';

export default function Sidebar() {
  const { agents, selectedAgent, selectAgent } = useAgentStore();
  const { setView, toggleSettings } = useAppStore();
  const { clearMessages } = useChatStore();

  return (
    <div className="w-60 h-screen bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold tracking-tight">Nativz Agents</h1>
        <p className="text-xs text-muted mt-0.5">AI-powered agency tools</p>
      </div>

      {/* Nav */}
      <div className="p-2">
        <button
          onClick={() => { selectAgent(null); setView('home'); clearMessages(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-white hover:bg-white/5 transition-colors"
        >
          <Home size={16} /> Home
        </button>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto px-2">
        <p className="text-[11px] uppercase tracking-wider text-muted px-3 py-2">Agents</p>
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => { selectAgent(agent); setView('chat'); clearMessages(); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedAgent?.id === agent.id ? 'bg-accent/10 text-accent' : 'text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-base">{agent.icon}</span>
            <span className="truncate">{agent.name}</span>
          </button>
        ))}
      </div>

      {/* Settings */}
      <div className="p-2 border-t border-border">
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
