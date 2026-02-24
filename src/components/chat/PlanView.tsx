import { useState } from 'react';
import { ChevronDown, ChevronRight, Circle, CheckCircle2, XCircle, Loader2, SkipForward } from 'lucide-react';

type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

interface PlanStep {
  id: string;
  description: string;
  tools: string[];
  status: StepStatus;
  result?: string;
  error?: string;
}

interface PlanViewProps {
  goal: string;
  steps: PlanStep[];
}

const statusConfig: Record<StepStatus, { icon: typeof Circle; color: string; label: string }> = {
  pending: { icon: Circle, color: 'text-zinc-600', label: 'Pending' },
  running: { icon: Loader2, color: 'text-blue-400', label: 'Running' },
  completed: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Done' },
  failed: { icon: XCircle, color: 'text-red-400', label: 'Failed' },
  skipped: { icon: SkipForward, color: 'text-zinc-500', label: 'Skipped' },
};

function StepRow({ step }: { step: PlanStep }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[step.status];
  const Icon = cfg.icon;
  const hasDetail = !!(step.result ?? step.error);

  return (
    <div className="border-l-2 border-zinc-800 ml-2 pl-3 py-1">
      <button
        type="button"
        onClick={() => hasDetail && setExpanded(!expanded)}
        className="flex items-start gap-2 w-full text-left group"
      >
        <div className="mt-0.5 shrink-0">
          {step.status === 'running' ? (
            <Icon size={16} className={`animate-spin ${cfg.color}`} />
          ) : (
            <Icon size={16} className={cfg.color} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-zinc-300">{step.description}</span>
          {step.tools.length > 0 && (
            <div className="flex gap-1 mt-0.5 flex-wrap">
              {step.tools.map((tool) => (
                <span
                  key={tool}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>
        {hasDetail && (
          <div className="mt-0.5 shrink-0">
            {expanded
              ? <ChevronDown size={12} className="text-zinc-600" />
              : <ChevronRight size={12} className="text-zinc-600" />
            }
          </div>
        )}
      </button>
      {expanded && hasDetail && (
        <div className="ml-6 mt-1 text-xs font-mono text-zinc-500 whitespace-pre-wrap max-h-32 overflow-y-auto">
          {step.error ? (
            <span className="text-red-400">{step.error}</span>
          ) : (
            step.result
          )}
        </div>
      )}
    </div>
  );
}

export default function PlanView({ goal, steps }: PlanViewProps) {
  const [collapsed, setCollapsed] = useState(false);

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const totalCount = steps.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="my-2 rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-medium text-zinc-300 truncate flex-1">
          📋 {goal}
        </span>
        <span className="text-xs text-zinc-500 shrink-0">
          {completedCount}/{totalCount}
        </span>
        {collapsed
          ? <ChevronRight size={14} className="text-zinc-600 shrink-0" />
          : <ChevronDown size={14} className="text-zinc-600 shrink-0" />
        }
      </button>

      {/* Progress bar */}
      <div className="h-0.5 bg-zinc-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {!collapsed && (
        <div className="px-2 py-2 space-y-0.5">
          {steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  );
}
