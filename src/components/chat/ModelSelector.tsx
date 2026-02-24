import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useModelStore } from '../../stores/modelStore';
import type { Provider } from '../../lib/types';

export default function ModelSelector() {
  const {
    currentProviderId,
    currentModelId,
    availableProviders,
    refreshProviders,
    setProvider,
  } = useModelStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshProviders();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentProvider = availableProviders.find((p) => p.id === currentProviderId);
  const currentModel = currentProvider?.models.find((m) => m.id === currentModelId);

  const handleSelect = async (provider: Provider, modelId: string) => {
    await setProvider(provider.id, modelId);
    setOpen(false);
  };

  const healthDot = (status: string) => {
    const color =
      status === 'healthy' ? 'bg-success' : status === 'degraded' ? 'bg-yellow-500' : 'bg-error';
    return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
  };

  const formatCost = (cost?: number) => {
    if (cost == null) return null;
    if (cost < 0.01) return `<$0.01`;
    return `~$${cost.toFixed(2)}`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted hover:text-white hover:bg-white/5 transition-colors border border-border"
      >
        {currentProvider && healthDot(currentProvider.health.status)}
        <span className="font-medium">
          {currentProvider?.name ?? 'Select Model'}
          {currentModel ? ` / ${currentModel.name}` : ''}
        </span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-72 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-border">
            <p className="text-[10px] uppercase tracking-wider text-muted px-2 py-1">Providers</p>
          </div>
          <div className="max-h-80 overflow-y-auto p-1">
            {availableProviders.map((provider) => (
              <div key={provider.id}>
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted">
                  {healthDot(provider.health.status)}
                  <span className="font-semibold text-white">{provider.name}</span>
                  {provider.isSubscription && (
                    <span className="ml-auto text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-medium">
                      ∞
                    </span>
                  )}
                </div>
                {provider.models.map((model) => {
                  const isActive =
                    currentProviderId === provider.id && currentModelId === model.id;
                  return (
                    <button
                      key={model.id}
                      onClick={() => handleSelect(provider, model.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 ml-4 mr-1 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-accent/10 text-accent'
                          : 'text-muted hover:text-white hover:bg-white/5'
                      }`}
                      style={{ width: 'calc(100% - 1.25rem)' }}
                    >
                      <span>{model.name}</span>
                      <span className="text-[10px] opacity-60">
                        {provider.isSubscription
                          ? 'included'
                          : formatCost(provider.estimatedCostPerMessage) ?? '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
            {availableProviders.length === 0 && (
              <p className="text-xs text-muted text-center py-4">No providers configured</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
