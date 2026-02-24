import { useAgentStore } from '../../stores/agentStore';
import { useAppStore } from '../../stores/appStore';
import { useChatStore } from '../../stores/chatStore';
import AgentCard from './AgentCard';
import type { Agent } from '../../lib/types';

export default function AgentPicker() {
  const { agents, selectAgent } = useAgentStore();
  const { setView } = useAppStore();
  const { clearMessages } = useChatStore();

  const handleSelect = (agent: Agent) => {
    selectAgent(agent);
    clearMessages();
    setView('chat');
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Choose an Agent</h1>
        <p className="text-muted text-sm">Select an AI agent to start working with.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
