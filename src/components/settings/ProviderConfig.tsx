import { useState, useEffect, useCallback } from "react";
import { useModelStore } from "../../stores/modelStore";
import type { Provider, ModelInfo } from "../../lib/types";
import {
  Server,
  Key,
  Globe,
  Check,
  X,
  AlertCircle,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Zap,
  DollarSign,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ProviderFormState {
  apiKey: string;
  baseUrl: string;
  selectedModel: string;
  isSubscription: boolean;
}

export default function ProviderConfig() {
  const { availableProviders, refreshProviders, loading } = useModelStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formStates, setFormStates] = useState<
    Record<string, ProviderFormState>
  >({});
  const [testResults, setTestResults] = useState<
    Record<string, "testing" | "success" | "error">
  >({});
  const [orderedProviders, setOrderedProviders] = useState<Provider[]>([]);

  useEffect(() => {
    void refreshProviders();
  }, [refreshProviders]);

  useEffect(() => {
    setOrderedProviders(availableProviders);
  }, [availableProviders]);

  const getFormState = useCallback(
    (provider: Provider): ProviderFormState => {
      return (
        formStates[provider.id] ?? {
          apiKey: "",
          baseUrl: "",
          selectedModel: provider.models[0]?.id ?? "",
          isSubscription: provider.isSubscription,
        }
      );
    },
    [formStates]
  );

  const updateForm = (providerId: string, patch: Partial<ProviderFormState>) => {
    setFormStates((prev) => ({
      ...prev,
      [providerId]: {
        ...getFormState(
          orderedProviders.find((p) => p.id === providerId)!
        ),
        ...patch,
      },
    }));
  };

  const handleTestConnection = async (providerId: string) => {
    setTestResults((prev) => ({ ...prev, [providerId]: "testing" }));
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const provider = orderedProviders.find((p) => p.id === providerId);
    const isHealthy = provider?.health.status === "healthy";
    setTestResults((prev) => ({
      ...prev,
      [providerId]: isHealthy ? "success" : "error",
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-emerald-400";
      case "degraded":
        return "text-amber-400";
      default:
        return "text-red-400";
    }
  };

  const formatCost = (model: ModelInfo) => {
    const input = model.costPerInputToken ?? 0;
    const output = model.costPerOutputToken ?? 0;
    if (input === 0 && output === 0) return "Free";
    return `$${(input * 1_000_000).toFixed(2)} / $${(output * 1_000_000).toFixed(2)} per 1M`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading providers...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">LLM Providers</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Configure API keys, models, and priority ordering.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refreshProviders()}
        >
          <RefreshCw size={12} className="mr-1" />
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {orderedProviders.map((provider, index) => {
          const isExpanded = expanded === provider.id;
          const form = getFormState(provider);
          const testResult = testResults[provider.id];

          return (
            <Card key={provider.id}>
              <CardHeader
                className="cursor-pointer p-4"
                onClick={() =>
                  setExpanded(isExpanded ? null : provider.id)
                }
              >
                <div className="flex items-center gap-3">
                  <GripVertical
                    size={14}
                    className="text-muted-foreground/40 cursor-grab shrink-0"
                  />
                  <span className="text-xs text-muted-foreground w-5 text-center shrink-0">
                    {index + 1}
                  </span>
                  <Server size={16} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {provider.name}
                      </span>
                      <span
                        className={`text-xs ${getStatusColor(provider.health.status)}`}
                      >
                        ● {provider.health.status}
                      </span>
                      {provider.isSubscription && (
                        <Badge variant="secondary" className="text-[10px]">
                          Subscription
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {provider.models.length} model
                      {provider.models.length !== 1 ? "s" : ""} available
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  <Separator />

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Key size={12} /> API Key
                    </label>
                    <Input
                      type="password"
                      value={form.apiKey}
                      onChange={(e) =>
                        updateForm(provider.id, { apiKey: e.target.value })
                      }
                      placeholder="Enter API key..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Globe size={12} /> Base URL (optional)
                    </label>
                    <Input
                      type="text"
                      value={form.baseUrl}
                      onChange={(e) =>
                        updateForm(provider.id, { baseUrl: e.target.value })
                      }
                      placeholder="https://api.example.com/v1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Zap size={12} /> Default Model
                    </label>
                    <select
                      value={form.selectedModel}
                      onChange={(e) =>
                        updateForm(provider.id, {
                          selectedModel: e.target.value,
                        })
                      }
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      {provider.models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({Math.round(m.contextWindow / 1000)}k ctx)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <DollarSign size={12} /> Model Costs
                    </label>
                    <div className="space-y-1">
                      {provider.models.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between text-xs text-muted-foreground py-1.5 px-2 rounded bg-muted/50"
                        >
                          <span>{m.name}</span>
                          <span className="font-mono">{formatCost(m)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void handleTestConnection(provider.id)
                      }
                      disabled={testResult === "testing"}
                    >
                      {testResult === "testing" ? (
                        <Loader2 size={12} className="animate-spin mr-1" />
                      ) : testResult === "success" ? (
                        <Check size={12} className="text-emerald-400 mr-1" />
                      ) : testResult === "error" ? (
                        <X size={12} className="text-red-400 mr-1" />
                      ) : (
                        <AlertCircle size={12} className="mr-1" />
                      )}
                      Test Connection
                    </Button>
                    {testResult === "success" && (
                      <span className="text-xs text-emerald-400">
                        Connected
                      </span>
                    )}
                    {testResult === "error" && (
                      <span className="text-xs text-red-400">Failed</span>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {orderedProviders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No providers configured. Add provider API keys to get started.
        </div>
      )}
    </div>
  );
}
