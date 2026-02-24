import { useState, useEffect, useCallback } from 'react';
import { useModelStore } from '../../stores/modelStore';
import type { Provider, ModelInfo } from '../../lib/types';
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
} from 'lucide-react';

interface ProviderFormState {
  apiKey: string;
  baseUrl: string;
  selectedModel: string;
  isSubscription: boolean;
}

export default function ProviderConfig() {
  const { availableProviders, refreshProviders, loading } = useModelStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formStates, setFormStates] = useState<Record<string, ProviderFormState>>({});
  const [testResults, setTestResults] = useState<Record<string, 'testing' | 'success' | 'error'>>({});
  const [dragId, setDragId] = useState<string | null>(null);
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
          apiKey: '',
          baseUrl: '',
          selectedModel: provider.models[0]?.id ?? '',
          isSubscription: provider.isSubscription,
        }
      );
    },
    [formStates]
  );

  const updateForm = (providerId: string, patch: Partial<ProviderFormState>) => {
    setFormStates((prev) => ({
      ...prev,
      [providerId]: { ...getFormState(orderedProviders.find((p) => p.id === providerId)!), ...patch },
    }));
  };

  const handleTestConnection = async (providerId: string) => {
    setTestResults((prev) => ({ ...prev, [providerId]: 'testing' }));
    // Simulate test — in production this would call the backend
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const provider = orderedProviders.find((p) => p.id === providerId);
    const isHealthy = provider?.health.status === 'healthy';
    setTestResults((prev) => ({ ...prev, [providerId]: isHealthy ? 'success' : 'error' }));
  };

  const handleDragStart = (id: string) => setDragId(id);

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;

    setOrderedProviders((prev) => {
      const items = [...prev];
      const fromIdx = items.findIndex((p) => p.id === dragId);
      const toIdx = items.findIndex((p) => p.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = items.splice(fromIdx, 1);
      items.splice(toIdx, 0, moved);
      return items;
    });
  };

  const handleDragEnd = () => setDragId(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      default:
        return 'text-red-400';
    }
  };

  const formatCost = (model: ModelInfo) => {
    const input = model.costPerInputToken ?? 0;
    const output = model.costPerOutputToken ?? 0;
    if (input === 0 && output === 0) return 'Free';
    return `$${(input * 1_000_000).toFixed(2)} / $${(output * 1_000_000).toFixed(2)} per 1M`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted">
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading providers...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">LLM Providers</h3>
          <p className="text-sm text-muted mt-1">
            Configure API keys, models, and priority ordering.
          </p>
        </div>
        <button
          onClick={() => void refreshProviders()}
          className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-white/5 text-muted hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {orderedProviders.map((provider, index) => {
          const isExpanded = expanded === provider.id;
          const form = getFormState(provider);
          const testResult = testResults[provider.id];

          return (
            <div
              key={provider.id}
              draggable
              onDragStart={() => handleDragStart(provider.id)}
              onDragOver={(e) => handleDragOver(e, provider.id)}
              onDragEnd={handleDragEnd}
              className={`border rounded-xl transition-all ${
                dragId === provider.id
                  ? 'border-accent/50 opacity-50'
                  : 'border-border hover:border-white/10'
              } bg-surface`}
            >
              {/* Header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : provider.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <GripVertical size={14} className="text-muted/40 cursor-grab shrink-0" />
                <span className="text-xs text-muted/50 w-5 text-center shrink-0">
                  {index + 1}
                </span>
                <Server size={16} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{provider.name}</span>
                    <span className={`text-xs ${getStatusColor(provider.health.status)}`}>
                      ● {provider.health.status}
                    </span>
                    {provider.isSubscription && (
                      <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                        Subscription
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {provider.models.length} model{provider.models.length !== 1 ? 's' : ''} available
                  </div>
                </div>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {/* Expanded Config */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                  {/* API Key */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1.5">
                      <Key size={12} /> API Key
                    </label>
                    <input
                      type="password"
                      value={form.apiKey}
                      onChange={(e) => updateForm(provider.id, { apiKey: e.target.value })}
                      placeholder="Enter API key..."
                      className="w-full bg-black border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent/50"
                    />
                  </div>

                  {/* Base URL */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1.5">
                      <Globe size={12} /> Base URL (optional)
                    </label>
                    <input
                      type="text"
                      value={form.baseUrl}
                      onChange={(e) => updateForm(provider.id, { baseUrl: e.target.value })}
                      placeholder="https://api.example.com/v1"
                      className="w-full bg-black border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent/50"
                    />
                  </div>

                  {/* Model Selection */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1.5">
                      <Zap size={12} /> Default Model
                    </label>
                    <select
                      value={form.selectedModel}
                      onChange={(e) => updateForm(provider.id, { selectedModel: e.target.value })}
                      className="w-full bg-black border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent/50"
                    >
                      {provider.models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({Math.round(m.contextWindow / 1000)}k ctx)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cost Display */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1.5">
                      <DollarSign size={12} /> Model Costs
                    </label>
                    <div className="space-y-1">
                      {provider.models.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between text-xs text-muted py-1 px-2 rounded bg-black/40"
                        >
                          <span>{m.name}</span>
                          <span className="font-mono">{formatCost(m)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subscription Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Subscription plan</span>
                    <button
                      onClick={() => updateForm(provider.id, { isSubscription: !form.isSubscription })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        form.isSubscription ? 'bg-accent' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          form.isSubscription ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Test Connection */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => void handleTestConnection(provider.id)}
                      disabled={testResult === 'testing'}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-white/5 disabled:opacity-50 transition-colors"
                    >
                      {testResult === 'testing' ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : testResult === 'success' ? (
                        <Check size={12} className="text-green-400" />
                      ) : testResult === 'error' ? (
                        <X size={12} className="text-red-400" />
                      ) : (
                        <AlertCircle size={12} />
                      )}
                      Test Connection
                    </button>
                    {testResult === 'success' && (
                      <span className="text-xs text-green-400">Connected</span>
                    )}
                    {testResult === 'error' && (
                      <span className="text-xs text-red-400">Failed</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {orderedProviders.length === 0 && (
        <div className="text-center py-12 text-muted text-sm">
          No providers configured. Add provider API keys to get started.
        </div>
      )}
    </div>
  );
}
