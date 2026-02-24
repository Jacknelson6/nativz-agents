import { useAgentStore } from '../../stores/agentStore';
import { useAppStore } from '../../stores/appStore';
import AgentCard from './AgentCard';
import type { Agent } from '../../lib/types';

export default function AgentPicker() {
  const { agents, selectAgent } = useAgentStore();
  const { setView } = useAppStore();

  const handleSelect = (agent: Agent) => {
    selectAgent(agent);
    setView('chat');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-100 mb-1.5">Choose an Agent</h1>
        <p className="text-[13px] text-zinc-500">Select an AI agent to start working with.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
