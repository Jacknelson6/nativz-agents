import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useModelStore } from "../../stores/modelStore";
import { useAgentStore } from "../../stores/agentStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function ModelSelector() {
  const {
    currentProviderId,
    currentModelId,
    availableProviders,
    refreshProviders,
    setProvider,
  } = useModelStore();

  const { selectedAgent } = useAgentStore();

  useEffect(() => {
    refreshProviders(selectedAgent?.id);
  }, [selectedAgent?.id]);

  const currentProvider = availableProviders.find(
    (p) => p.id === currentProviderId
  );
  const currentModel = currentProvider?.models.find(
    (m) => m.id === currentModelId
  );

  const handleSelect = async (providerId: string, modelId: string) => {
    await setProvider(selectedAgent?.id ?? "", providerId, modelId);
  };

  const healthDot = (status: string) => {
    const color =
      status === "healthy"
        ? "bg-emerald-400"
        : status === "degraded"
          ? "bg-amber-400"
          : "bg-red-400";
    return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
  };

  const formatCost = (cost?: number) => {
    if (cost == null) return null;
    if (cost < 0.01) return "<$0.01";
    return `~$${cost.toFixed(2)}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8">
          {currentProvider && healthDot(currentProvider.health.status)}
          <span className="font-medium">
            {currentProvider?.name ?? "Select Model"}
            {currentModel ? ` / ${currentModel.name}` : ""}
          </span>
          <ChevronDown size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Providers
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableProviders.map((provider) => (
          <DropdownMenuGroup key={provider.id}>
            <DropdownMenuLabel className="flex items-center gap-2 text-xs">
              {healthDot(provider.health.status)}
              <span>{provider.name}</span>
              {provider.isSubscription && (
                <Badge variant="secondary" className="ml-auto text-[10px] h-4">
                  ∞
                </Badge>
              )}
            </DropdownMenuLabel>
            {provider.models.map((model) => {
              const isActive =
                currentProviderId === provider.id &&
                currentModelId === model.id;
              return (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => handleSelect(provider.id, model.id)}
                  className={`ml-4 ${isActive ? "bg-accent" : ""}`}
                >
                  <span className="flex-1">{model.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {provider.isSubscription
                      ? "included"
                      : formatCost(provider.estimatedCostPerMessage) ?? "—"}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        ))}
        {availableProviders.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4">
            No providers configured
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
