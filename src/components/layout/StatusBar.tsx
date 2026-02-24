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
} from "lucide-react";
import { useModelStore } from "../../stores/modelStore";
import { useChatStore } from "../../stores/chatStore";
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
  const { messages } = useChatStore();

  const currentProvider = useMemo(
    () => availableProviders.find((p) => p.id === currentProviderId),
    [availableProviders, currentProviderId]
  );

  const currentModel = useMemo(
    () => currentProvider?.models.find((m) => m.id === currentModelId),
    [currentProvider, currentModelId]
  );

  const tokenCount = useMemo(() => {
    return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  }, [messages]);

  const estimatedCost = useMemo(() => {
    if (!currentModel?.costPerInputToken) return 0;
    const inputTokens = messages
      .filter((m) => m.role === "user")
      .reduce((sum, m) => sum + estimateTokens(m.content), 0);
    const outputTokens = messages
      .filter((m) => m.role === "assistant")
      .reduce((sum, m) => sum + estimateTokens(m.content), 0);

    return (
      inputTokens * (currentModel.costPerInputToken ?? 0) * 100 +
      outputTokens * (currentModel.costPerOutputToken ?? 0) * 100
    );
  }, [messages, currentModel]);

  const health = currentProvider?.health;
  const healthStatus: HealthStatus = health?.status ?? "down";
  const latencyMs = health?.latencyMs ?? 0;

  return (
    <div className="flex items-center gap-1 px-4 py-1.5 border-t text-[11px] text-muted-foreground select-none shrink-0">
      {/* Model + Provider */}
      <Badge variant="secondary" className="text-[10px] h-5 gap-1 font-normal">
        <Cpu size={10} />
        {currentModel?.name ?? currentModelId ?? "No model"}
        {currentProvider && (
          <span className="text-muted-foreground/60">
            ({currentProvider.name})
          </span>
        )}
      </Badge>

      <Separator orientation="vertical" className="h-3 mx-1" />

      {/* Token count */}
      <Badge variant="outline" className="text-[10px] h-5 gap-1 font-normal">
        <Hash size={9} />
        {tokenCount.toLocaleString()} tokens
      </Badge>

      <Separator orientation="vertical" className="h-3 mx-1" />

      {/* Cost */}
      <Badge variant="outline" className="text-[10px] h-5 gap-1 font-normal">
        <DollarSign size={9} />
        {formatCost(estimatedCost)}
      </Badge>

      <Separator orientation="vertical" className="h-3 mx-1" />

      {/* Connection status */}
      <Badge variant="outline" className="text-[10px] h-5 gap-1 font-normal">
        {healthStatus === "down" ? <WifiOff size={10} /> : <Wifi size={10} />}
        <StatusDot status={healthStatus} />
        <span className="capitalize">{healthStatus}</span>
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
