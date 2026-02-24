import { useState } from 'react';
import { ChevronDown, ChevronRight, Brain, Wrench, BookOpen, Database, Loader2 } from 'lucide-react';

interface ThinkingStep {
  id: string;
  type: 'thinking' | 'tool_call' | 'knowledge' | 'memory' | 'reflection' | 'plan';
  label: string;
  detail?: string;
  status: 'active' | 'done';
  timestamp: number;
}

interface ThinkingIndicatorProps {
  steps: ThinkingStep[];
  isActive: boolean;
}

const iconMap = {
  thinking: Brain,
  tool_call: Wrench,
  knowledge: BookOpen,
  memory: Database,
  reflection: Brain,
  plan: Brain,
} as const;

function StepItem({ step }: { step: ThinkingStep }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = iconMap[step.type];

  return (
    <div
      className="overflow-hidden transition-all duration-300 ease-out"
      style={{ opacity: step.status === 'active' ? 1 : 0.7 }}
    >
      <button
        type="button"
        onClick={() => step.detail && setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-white/5 transition-colors text-sm"
      >
        {step.status === 'active' ? (
          <Loader2 size={14} className="animate-spin text-blue-400 shrink-0" />
        ) : (
          <Icon size={14} className="text-zinc-500 shrink-0" />
        )}
        <span className="text-zinc-300 truncate">{step.label}</span>
        {step.detail && (
          expanded
            ? <ChevronDown size={12} className="text-zinc-600 ml-auto shrink-0" />
            : <ChevronRight size={12} className="text-zinc-600 ml-auto shrink-0" />
        )}
      </button>
      {expanded && step.detail && (
        <div className="ml-7 px-2 py-1 text-xs text-zinc-500 font-mono whitespace-pre-wrap border-l border-zinc-800">
          {step.detail}
        </div>
      )}
    </div>
  );
}

export default function ThinkingIndicator({ steps, isActive }: ThinkingIndicatorProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (steps.length === 0 && !isActive) return null;

  return (
    <div className="my-2 rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-white/5 transition-colors"
      >
        {isActive ? (
          <Loader2 size={16} className="animate-spin text-blue-400" />
        ) : (
          <Brain size={16} className="text-zinc-500" />
        )}
        <span className="text-sm text-zinc-400 font-medium">
          {isActive ? 'Thinking...' : `Completed ${steps.length} steps`}
        </span>
        {collapsed
          ? <ChevronRight size={14} className="text-zinc-600 ml-auto" />
          : <ChevronDown size={14} className="text-zinc-600 ml-auto" />
        }
      </button>

      {!collapsed && (
        <div className="px-1 pb-2 space-y-0.5">
          {steps.map((step) => (
            <StepItem key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  );
}
