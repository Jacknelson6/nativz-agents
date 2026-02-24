import type { Agent } from '../../lib/types';
import { ArrowRight } from 'lucide-react';

interface Props {
  agent: Agent;
  onSelect: (agent: Agent) => void;
}

export default function AgentCard({ agent, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(agent)}
      className="group text-left p-5 rounded-xl bg-surface border border-border hover:border-accent/30 transition-all duration-200"
    >
      <div className="text-3xl mb-3">{agent.icon}</div>
      <h3 className="font-semibold text-sm mb-1">{agent.name}</h3>
      <p className="text-xs text-muted leading-relaxed mb-4">{agent.description}</p>
      <div className="flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
        Start Chat <ArrowRight size={12} />
      </div>
    </button>
  );
}
