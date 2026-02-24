import { useState, useEffect, useRef, type ReactNode } from 'react';
import {
  Brain,
  Search,
  Bookmark,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Wrench,
  ListChecks,
} from 'lucide-react';
import ArtifactRenderer from './ArtifactRenderer';

// ─── Types for streaming events ──────────────────────────────────────────────

interface StreamingToolCall {
  name: string;
  toolId: string;
  status: 'running' | 'completed' | 'error';
  input: Record<string, unknown>;
  result?: string;
}

interface KnowledgeResult {
  query: string;
  results: Array<{ title: string; score: number; snippet: string }>;
}

interface MemoryUpdate {
  entity: string;
  content: string;
  category: string;
}

interface PlanStep {
  stepId: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  tools: string[];
  result?: string;
}

interface StreamingState {
  text: string;
  isThinking: boolean;
  thinkingDurationMs: number;
  toolCalls: StreamingToolCall[];
  knowledgeResults: KnowledgeResult[];
  memoryUpdates: MemoryUpdate[];
  planSteps: PlanStep[];
  isDone: boolean;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ThinkingBadge({ durationMs }: { durationMs: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (durationMs > 0) {
      setElapsed(durationMs);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => setElapsed(Date.now() - start), 100);
    return () => clearInterval(interval);
  }, [durationMs]);

  const seconds = (elapsed / 1000).toFixed(1);

  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-3 text-sm">
      <Brain size={14} className="text-purple-400 animate-pulse" />
      <span className="text-purple-300">
        {durationMs > 0 ? `Thought for ${seconds}s` : `Thinking... ${seconds}s`}
      </span>
    </div>
  );
}

function ToolCallCard({ tool }: { tool: StreamingToolCall }) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon: Record<string, ReactNode> = {
    running: <Loader2 size={14} className="animate-spin text-amber-400" />,
    completed: <CheckCircle2 size={14} className="text-emerald-400" />,
    error: <XCircle size={14} className="text-red-400" />,
  };

  return (
    <div className="my-2 rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-white/[0.03] transition-colors"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Wrench size={12} className="text-zinc-400" />
        <span className="text-xs font-medium text-zinc-300 flex-1">{tool.name}</span>
        {statusIcon[tool.status]}
      </button>
      {expanded && (
        <div className="px-3 pb-2 border-t border-white/5">
          {Object.keys(tool.input).length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Input</span>
              <pre className="text-xs text-zinc-400 mt-1 overflow-x-auto">
                {JSON.stringify(tool.input, null, 2)}
              </pre>
            </div>
          )}
          {tool.result && (
            <div className="mt-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Result</span>
              <pre className="text-xs text-zinc-400 mt-1 overflow-x-auto max-h-40">
                {tool.result.slice(0, 500)}
                {tool.result.length > 500 ? '...' : ''}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KnowledgeCard({ kr }: { kr: KnowledgeResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-2 rounded-lg border border-sky-500/20 bg-sky-500/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left"
      >
        <Search size={12} className="text-sky-400" />
        <span className="text-xs text-sky-300 flex-1">
          Searched: &quot;{kr.query}&quot; — {kr.results.length} results
        </span>
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {expanded && (
        <div className="px-3 pb-2 space-y-1 border-t border-sky-500/10">
          {kr.results.map((r, i) => (
            <div key={i} className="py-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-200">{r.title}</span>
                <span className="text-[10px] text-zinc-500">{(r.score * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{r.snippet}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MemoryBadge({ update }: { update: MemoryUpdate }) {
  return (
    <div className="inline-flex items-center gap-1.5 my-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs">
      <Bookmark size={10} className="text-emerald-400" />
      <span className="text-emerald-300">Remembered: {update.content.slice(0, 60)}</span>
    </div>
  );
}

function PlanProgress({ steps }: { steps: PlanStep[] }) {
  if (steps.length === 0) return null;

  const completed = steps.filter((s) => s.status === 'completed').length;

  return (
    <div className="my-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center gap-2 mb-2">
        <ListChecks size={14} className="text-zinc-400" />
        <span className="text-xs font-medium text-zinc-300">
          Plan Progress ({completed}/{steps.length})
        </span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${steps.length > 0 ? (completed / steps.length) * 100 : 0}%` }}
        />
      </div>
      <div className="space-y-1">
        {steps.map((step) => (
          <div key={step.stepId} className="flex items-center gap-2 text-xs">
            {step.status === 'running' && <Loader2 size={10} className="animate-spin text-amber-400" />}
            {step.status === 'completed' && <CheckCircle2 size={10} className="text-emerald-400" />}
            {step.status === 'failed' && <XCircle size={10} className="text-red-400" />}
            {(step.status === 'pending' || step.status === 'skipped') && (
              <div className="w-2.5 h-2.5 rounded-full border border-zinc-600" />
            )}
            <span
              className={
                step.status === 'completed'
                  ? 'text-zinc-400 line-through'
                  : step.status === 'running'
                  ? 'text-zinc-200'
                  : 'text-zinc-500'
              }
            >
              {step.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Cursor blink ────────────────────────────────────────────────────────────

function BlinkingCursor() {
  return <span className="inline-block w-0.5 h-4 bg-white/80 animate-pulse ml-0.5 align-text-bottom" />;
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface StreamingMessageProps {
  state: StreamingState;
}

export default function StreamingMessage({ state }: StreamingMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [state.text, state.toolCalls, state.planSteps]);

  const showCursor = !state.isDone && state.text.length > 0;

  return (
    <div ref={containerRef} className="space-y-1">
      {/* Thinking indicator */}
      {(state.isThinking || state.thinkingDurationMs > 0) && (
        <ThinkingBadge durationMs={state.isThinking ? 0 : state.thinkingDurationMs} />
      )}

      {/* Plan progress */}
      <PlanProgress steps={state.planSteps} />

      {/* Interleaved content: text + inline events */}
      {state.knowledgeResults.map((kr, i) => (
        <KnowledgeCard key={`kr-${i}`} kr={kr} />
      ))}

      {state.memoryUpdates.map((mu, i) => (
        <MemoryBadge key={`mem-${i}`} update={mu} />
      ))}

      {/* Tool calls as collapsible cards */}
      {state.toolCalls.map((tc) => (
        <ToolCallCard key={tc.toolId} tool={tc} />
      ))}

      {/* Streaming text with cursor */}
      {state.text.length > 0 && (
        <div className="prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 text-sm leading-relaxed">
          <span className="whitespace-pre-wrap">{state.text}</span>
          {showCursor && <BlinkingCursor />}
        </div>
      )}

      {/* Artifacts in final text */}
      {state.isDone && <ArtifactRenderer text={state.text} />}
    </div>
  );
}

export type { StreamingState, StreamingToolCall, KnowledgeResult, MemoryUpdate, PlanStep };
