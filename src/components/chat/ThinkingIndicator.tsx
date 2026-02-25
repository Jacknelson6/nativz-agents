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
        className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-muted/30 transition-colors text-sm"
      >
        {step.status === 'active' ? (
          <Loader2 size={14} className="animate-spin text-blue-400 shrink-0" />
        ) : (
          <Icon size={14} className="text-muted-foreground shrink-0" />
        )}
        <span className="text-foreground/80 truncate">{step.label}</span>
        {step.detail && (
          expanded
            ? <ChevronDown size={12} className="text-muted-foreground/60 ml-auto shrink-0" />
            : <ChevronRight size={12} className="text-muted-foreground/60 ml-auto shrink-0" />
        )}
      </button>
      {expanded && step.detail && (
        <div className="ml-7 px-2 py-1 text-xs text-muted-foreground font-mono whitespace-pre-wrap border-l border-border">
          {step.detail}
        </div>
      )}
    </div>
  );
}

export default function ThinkingIndicator({ steps, isActive }: ThinkingIndicatorProps) {
  const [collapsed, setCollapsed] = useState(true);

  if (steps.length === 0 && !isActive) return null;

  const activeSteps = steps.filter(s => s.status === 'active').length;
  const doneSteps = steps.filter(s => s.status === 'done').length;

  return (
    <div className={`my-3 rounded-lg border overflow-hidden transition-all duration-300 ${
      isActive ? "border-blue-400/20 bg-blue-400/5" : "border-border bg-card/50"
    }`}>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-left hover:bg-muted/20 transition-colors"
      >
        {isActive ? (
          <Loader2 size={15} className="animate-spin text-blue-400 shrink-0" />
        ) : (
          <Brain size={15} className="text-muted-foreground shrink-0" />
        )}
        <span className="text-xs text-foreground/70 font-medium flex-1">
          {isActive
            ? `Working${activeSteps > 0 ? ` · ${activeSteps} active` : ''}${doneSteps > 0 ? ` · ${doneSteps} done` : ''}`
            : `Completed ${steps.length} step${steps.length !== 1 ? 's' : ''}`
          }
        </span>
        {collapsed
          ? <ChevronRight size={13} className="text-muted-foreground/40 shrink-0" />
          : <ChevronDown size={13} className="text-muted-foreground/40 shrink-0" />
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
