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
      className="group text-left p-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-150 hover:shadow-lg hover:shadow-zinc-950/50"
    >
      <div className="text-2xl mb-3">{agent.icon}</div>
      <h3 className="font-semibold text-[13px] text-zinc-100 mb-1">{agent.name}</h3>
      <p className="text-[12px] text-zinc-500 leading-relaxed mb-4 line-clamp-2">{agent.description}</p>
      <div className="flex items-center gap-1.5 text-[12px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        Start Chat <ArrowRight size={12} />
      </div>
    </button>
  );
}
