import type { ToolCall } from '../../lib/types';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function ToolStatus({ tool }: { tool: ToolCall }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-border text-xs">
      {tool.status === 'running' && <Loader2 size={14} className="animate-spin text-accent" />}
      {tool.status === 'completed' && <CheckCircle2 size={14} className="text-success" />}
      {tool.status === 'error' && <XCircle size={14} className="text-error" />}
      <span className="text-muted font-mono">{tool.name}</span>
      {tool.output && <span className="text-muted truncate max-w-48">→ {tool.output}</span>}
    </div>
  );
}
