import { useMemo } from 'react';
import {
  Cpu,
  Zap,
  Clock,
  Wifi,
  WifiOff,
  DollarSign,
  Command,
  Hash,
} from 'lucide-react';
import { useModelStore } from '../../stores/modelStore';
import { useChatStore } from '../../stores/chatStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function estimateTokens(text: string): number {
  // Rough: ~4 chars per token for English text
  return Math.ceil(text.length / 4);
}

function formatCost(cents: number): string {
  if (cents < 1) return '<$0.01';
  return `$${(cents / 100).toFixed(2)}`;
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

type HealthStatus = 'healthy' | 'degraded' | 'down';

function StatusDot({ status }: { status: HealthStatus }) {
  const colors: Record<HealthStatus, string> = {
    healthy: 'bg-emerald-400',
    degraded: 'bg-amber-400',
    down: 'bg-red-400',
  };

  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[status]}`} />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StatusBar() {
  const { currentProviderId, currentModelId, availableProviders } = useModelStore();
  const { messages } = useChatStore();

  // Find current provider info
  const currentProvider = useMemo(
    () => availableProviders.find((p) => p.id === currentProviderId),
    [availableProviders, currentProviderId]
  );

  const currentModel = useMemo(
    () => currentProvider?.models.find((m) => m.id === currentModelId),
    [currentProvider, currentModelId]
  );

  // Token count for current conversation
  const tokenCount = useMemo(() => {
    return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  }, [messages]);

  // Estimated cost
  const estimatedCost = useMemo(() => {
    if (!currentModel?.costPerInputToken) return 0;
    const inputTokens = messages
      .filter((m) => m.role === 'user')
      .reduce((sum, m) => sum + estimateTokens(m.content), 0);
    const outputTokens = messages
      .filter((m) => m.role === 'assistant')
      .reduce((sum, m) => sum + estimateTokens(m.content), 0);

    return (
      inputTokens * (currentModel.costPerInputToken ?? 0) * 100 +
      outputTokens * (currentModel.costPerOutputToken ?? 0) * 100
    );
  }, [messages, currentModel]);

  const health = currentProvider?.health;
  const healthStatus: HealthStatus = health?.status ?? 'down';
  const latencyMs = health?.latencyMs ?? 0;

  return (
    <div className="flex items-center gap-1 px-4 py-1.5 bg-zinc-950 border-t border-white/5 text-[11px] text-zinc-500 select-none">
      {/* Model + Provider */}
      <div className="flex items-center gap-1.5 mr-3">
        <Cpu size={11} />
        <span className="text-zinc-400">
          {currentModel?.name ?? currentModelId ?? 'No model'}
        </span>
        {currentProvider && (
          <span className="text-zinc-600">
            ({currentProvider.name})
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-3 bg-white/5" />

      {/* Token count */}
      <div className="flex items-center gap-1 mx-3">
        <Hash size={10} />
        <span>{tokenCount.toLocaleString()} tokens</span>
      </div>

      <div className="w-px h-3 bg-white/5" />

      {/* Cost */}
      <div className="flex items-center gap-1 mx-3">
        <DollarSign size={10} />
        <span>{formatCost(estimatedCost)}</span>
      </div>

      <div className="w-px h-3 bg-white/5" />

      {/* Connection status */}
      <div className="flex items-center gap-1.5 mx-3">
        {healthStatus === 'down' ? <WifiOff size={10} /> : <Wifi size={10} />}
        <StatusDot status={healthStatus} />
        <span className="capitalize">{healthStatus}</span>
      </div>

      {/* Latency */}
      {latencyMs > 0 && (
        <>
          <div className="w-px h-3 bg-white/5" />
          <div className="flex items-center gap-1 mx-3">
            <Clock size={10} />
            <span>{formatLatency(latencyMs)}</span>
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Keyboard shortcuts hint */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Zap size={9} />
          <kbd className="flex items-center gap-0.5 text-[9px]">
            <Command size={8} />K
          </kbd>
          <span>Commands</span>
        </div>
      </div>
    </div>
  );
}
