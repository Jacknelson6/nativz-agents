import { useState, useEffect, useRef } from 'react';
import { Users, ArrowRight, CheckCircle, Loader2, AlertCircle, ChevronDown } from 'lucide-react';

// ---- Types ----

interface AgentLane {
  id: string;
  name: string;
  icon: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  messages: LaneMessage[];
  output?: string;
  durationMs?: number;
}

interface LaneMessage {
  id: string;
  content: string;
  type: 'thinking' | 'output' | 'handoff';
  timestamp: number;
}

interface SharedContextEntry {
  key: string;
  value: string;
  author: string;
}

interface MultiAgentRun {
  id: string;
  teamName: string;
  task: string;
  agents: AgentLane[];
  sharedContext: SharedContextEntry[];
  combinedOutput?: string;
  status: 'running' | 'completed' | 'error';
  startedAt: number;
  completedAt?: number;
}

interface Props {
  run: MultiAgentRun;
  onCancel?: () => void;
}

// ---- Status Badge ----

function StatusBadge({ status }: { status: AgentLane['status'] }) {
  switch (status) {
    case 'pending':
      return <span className="text-xs text-muted bg-muted/10 px-2 py-0.5 rounded-full">Pending</span>;
    case 'running':
      return (
        <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Loader2 size={10} className="animate-spin" /> Running
        </span>
      );
    case 'completed':
      return (
        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle size={10} /> Done
        </span>
      );
    case 'error':
      return (
        <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
          <AlertCircle size={10} /> Error
        </span>
      );
  }
}

// ---- Agent Lane Component ----

function AgentLaneColumn({ agent }: { agent: AgentLane }) {
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agent.messages.length]);

  return (
    <div className="flex-1 min-w-[280px] max-w-[400px] border border-border rounded-xl bg-surface overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{agent.icon}</span>
          <span className="font-medium text-sm">{agent.name}</span>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[400px]">
        {agent.messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-xs p-2 rounded-lg ${
              msg.type === 'thinking'
                ? 'bg-muted/5 text-muted italic'
                : msg.type === 'handoff'
                  ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                  : 'bg-accent/5 text-foreground'
            }`}
          >
            {msg.type === 'handoff' && (
              <div className="flex items-center gap-1 mb-1 text-blue-400">
                <ArrowRight size={10} /> Handoff
              </div>
            )}
            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
          </div>
        ))}
        <div ref={messagesEnd} />
      </div>

      {/* Duration */}
      {agent.durationMs !== undefined && (
        <div className="px-4 py-2 border-t border-border text-xs text-muted">
          Completed in {(agent.durationMs / 1000).toFixed(1)}s
        </div>
      )}
    </div>
  );
}

// ---- Shared Context Panel ----

function SharedContextPanel({ entries }: { entries: SharedContextEntry[] }) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) return null;

  return (
    <div className="border border-border rounded-xl bg-surface overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm hover:bg-muted/5 transition-colors"
      >
        <span className="font-medium flex items-center gap-2">
          <Users size={14} /> Shared Context ({entries.length})
        </span>
        <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-3 space-y-1">
          {entries.map((entry) => (
            <div key={entry.key} className="text-xs flex gap-2">
              <span className="text-accent font-mono">{entry.key}:</span>
              <span className="text-muted truncate">{entry.value}</span>
              <span className="text-muted/50 ml-auto whitespace-nowrap">by {entry.author}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Progress Bar ----

function TeamProgress({ agents }: { agents: AgentLane[] }) {
  const completed = agents.filter((a) => a.status === 'completed').length;
  const pct = agents.length > 0 ? (completed / agents.length) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-muted/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted whitespace-nowrap">
        {completed}/{agents.length} agents
      </span>
    </div>
  );
}

// ---- Main Component ----

export default function MultiAgentView({ run, onCancel }: Props) {
  const [showCombined, setShowCombined] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users size={16} className="text-accent" />
            {run.teamName}
          </h3>
          <p className="text-xs text-muted mt-0.5">{run.task}</p>
        </div>
        <div className="flex items-center gap-2">
          {run.status === 'running' && onCancel && (
            <button
              onClick={onCancel}
              className="text-xs px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Cancel
            </button>
          )}
          {run.completedAt && (
            <span className="text-xs text-muted">
              {((run.completedAt - run.startedAt) / 1000).toFixed(1)}s total
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <TeamProgress agents={run.agents} />

      {/* Agent Lanes */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {run.agents.map((agent, i) => (
          <div key={agent.id} className="flex items-start gap-2">
            <AgentLaneColumn agent={agent} />
            {i < run.agents.length - 1 && (
              <div className="flex items-center self-center text-muted/30 px-1">
                <ArrowRight size={16} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Shared Context */}
      <SharedContextPanel entries={run.sharedContext} />

      {/* Combined Output */}
      {run.combinedOutput && (
        <div className="border border-border rounded-xl bg-surface overflow-hidden">
          <button
            onClick={() => setShowCombined(!showCombined)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-muted/5 transition-colors"
          >
            <span className="font-semibold flex items-center gap-2">
              <CheckCircle size={14} className="text-green-400" />
              Combined Output
            </span>
            <ChevronDown size={14} className={`transition-transform ${showCombined ? 'rotate-180' : ''}`} />
          </button>
          {showCombined && (
            <div className="px-4 pb-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed border-t border-border pt-3">
              {run.combinedOutput}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
