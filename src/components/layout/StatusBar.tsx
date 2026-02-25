import { useMemo } from "react";
import {
  Cpu,
  Clock,
  Wifi,
  WifiOff,
  DollarSign,
  Command,
  Hash,
  Zap,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { useModelStore } from "../../stores/modelStore";
import { useChatStore } from "../../stores/chatStore";
import { useAppStore } from "../../stores/appStore";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function formatCost(cents: number): string {
  if (cents < 1) return "<$0.01";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

type HealthStatus = "healthy" | "degraded" | "down";

function StatusDot({ status }: { status: HealthStatus }) {
  const colors: Record<HealthStatus, string> = {
    healthy: "bg-emerald-400",
    degraded: "bg-amber-400",
    down: "bg-red-400",
  };

  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${colors[status]}`}
    />
  );
}

export default function StatusBar() {
  const { currentProviderId, currentModelId, availableProviders } =
    useModelStore();
  const { messages, isStreaming, conversationTokens } = useChatStore();
  const sidecarStatus = useAppStore((s) => s.sidecarStatus);
  const showDevStats = useAppStore((s) => s.settings.showDevStats);

  const currentProvider = useMemo(
    () => availableProviders.find((p) => p.id === currentProviderId),
    [availableProviders, currentProviderId]
  );

  const currentModel = useMemo(
    () => currentProvider?.models.find((m) => m.id === currentModelId),
    [currentProvider, currentModelId]
  );

  const tokenCount = useMemo(() => {
    let sum = 0;
    for (const m of messages) {
      sum += estimateTokens(m.content);
      if (m.toolCalls) {
        for (const tc of m.toolCalls) {
          sum += estimateTokens(JSON.stringify(tc.input));
          if (tc.output) sum += estimateTokens(tc.output);
        }
      }
    }
    return sum;
  }, [messages]);

  const estimatedCost = useMemo(() => {
    if (!currentModel?.costPerInputToken) return 0;
    let inputTokens = 0;
    let outputTokens = 0;
    for (const m of messages) {
      const tokens = estimateTokens(m.content);
      if (m.role === "user") {
        inputTokens += tokens;
      } else if (m.role === "assistant") {
        outputTokens += tokens;
        // Tool call inputs count as output (model generates them)
        // Tool call outputs count as input (fed back to model)
        if (m.toolCalls) {
          for (const tc of m.toolCalls) {
            outputTokens += estimateTokens(JSON.stringify(tc.input));
            if (tc.output) inputTokens += estimateTokens(tc.output);
          }
        }
      }
    }
    return (
      inputTokens * (currentModel.costPerInputToken ?? 0) * 100 +
      outputTokens * (currentModel.costPerOutputToken ?? 0) * 100
    );
  }, [messages, currentModel]);

  const health = currentProvider?.health;
  const loading = useModelStore((s) => s.loading);
  const healthStatus: HealthStatus = loading
    ? "degraded"
    : health?.status ?? (availableProviders.length === 0 ? "degraded" : "down");
  const latencyMs = health?.latencyMs ?? 0;

  return (
    <div className="flex items-center gap-1 px-2 sm:px-4 py-1.5 border-t text-[11px] text-muted-foreground select-none shrink-0 overflow-x-auto">
      {/* Model + Provider */}
      <Badge variant="secondary" className="text-[10px] h-5 gap-1 font-normal">
        <Cpu size={10} />
        {loading
          ? "Loading..."
          : currentModel?.name ?? currentModelId ?? "No model"}
        {currentProvider && (
          <span className="text-muted-foreground/60">
            ({currentProvider.name})
          </span>
        )}
      </Badge>

      {showDevStats && (
        <>
          <Separator orientation="vertical" className="h-3 mx-1" />

          {/* Token count */}
          <Badge variant="outline" className="text-[10px] h-5 gap-1 font-normal">
            <Hash size={9} />
            {tokenCount.toLocaleString()} tokens
          </Badge>

          {/* Conversation tokens (streaming estimate) */}
          {(conversationTokens.input > 0 || conversationTokens.output > 0) && (
            <>
              <Separator orientation="vertical" className="h-3 mx-1" />
              <Badge variant="outline" className="text-[10px] h-5 gap-1 font-normal">
                <ArrowDown size={9} className="text-sky-400" />
                {conversationTokens.input.toLocaleString()}
                <ArrowUp size={9} className="text-emerald-400" />
                {conversationTokens.output.toLocaleString()}
              </Badge>
            </>
          )}

          <Separator orientation="vertical" className="h-3 mx-1" />

          {/* Cost */}
          <Badge variant="outline" className="text-[10px] h-5 gap-1 font-normal">
            <DollarSign size={9} />
            {formatCost(estimatedCost)}
          </Badge>
        </>
      )}

      <Separator orientation="vertical" className="h-3 mx-1" />

      {/* Connection status */}
      <Badge variant="outline" className="text-[10px] h-5 gap-1 font-normal">
        {healthStatus === "down" ? <WifiOff size={10} /> : <Wifi size={10} />}
        <StatusDot status={healthStatus} />
        <span className="capitalize">
          {loading ? "Connecting" : healthStatus === "degraded" && !health ? "Checking" : healthStatus}
        </span>
      </Badge>

      {latencyMs > 0 && (
        <>
          <Separator orientation="vertical" className="h-3 mx-1" />
          <Badge
            variant="outline"
            className="text-[10px] h-5 gap-1 font-normal"
          >
            <Clock size={9} />
            {formatLatency(latencyMs)}
          </Badge>
        </>
      )}

      {isStreaming && (
        <>
          <Separator orientation="vertical" className="h-3 mx-1" />
          <Badge variant="outline" className="text-[10px] h-5 gap-1 font-normal text-sky-400 border-sky-400/30 animate-pulse">
            <Zap size={9} />
            Processing
          </Badge>
        </>
      )}

      {sidecarStatus !== 'connected' && (
        <>
          <Separator orientation="vertical" className="h-3 mx-1" />
          <Badge variant="outline" className="text-[10px] h-5 gap-1 font-normal text-amber-400 border-amber-400/30">
            <WifiOff size={10} />
            {sidecarStatus === 'crashed' ? 'Disconnected' : 'Reconnecting...'}
          </Badge>
        </>
      )}

      <div className="flex-1" />

      {/* Keyboard hint */}
      <div className="flex items-center gap-1 text-muted-foreground/60">
        <Zap size={8} />
        <kbd className="flex items-center gap-0.5 text-[9px]">
          <Command size={8} />K
        </kbd>
        <span className="text-[10px]">Commands</span>
      </div>
    </div>
  );
}
