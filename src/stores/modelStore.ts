import { create } from 'zustand';
import type { Provider } from '../lib/types';
import { listProviders, setProvider as setTauriProvider } from '../lib/tauri';

interface ModelState {
  currentProviderId: string | null;
  currentModelId: string | null;
  availableProviders: Provider[];
  loading: boolean;
  refreshProviders: (agentId?: string) => Promise<void>;
  setProvider: (agentId: string, providerId: string, modelId?: string) => Promise<void>;
}

export const useModelStore = create<ModelState>((set, get) => ({
  currentProviderId: null,
  currentModelId: null,
  availableProviders: [],
  loading: false,

  refreshProviders: async (agentId?: string) => {
    set({ loading: true });
    try {
      const providers = await listProviders(agentId);
      const updates: Partial<ModelState> = { availableProviders: providers, loading: false };

      // Auto-select first healthy provider if none selected
      if (!get().currentProviderId && providers.length > 0) {
        const healthy = providers.find((p) => p.health?.status === 'healthy') ?? providers[0];
        updates.currentProviderId = healthy.id;
        if (healthy.models.length > 0) {
          updates.currentModelId = healthy.models[0].id;
        }
      }

      set(updates);
    } catch {
      set({ loading: false });
    }
  },

  setProvider: async (agentId, providerId, modelId?: string) => {
    await setTauriProvider(agentId, providerId);
    const provider = get().availableProviders.find((p) => p.id === providerId);
    const resolvedModelId = modelId ?? provider?.models[0]?.id ?? null;
    set({
      currentProviderId: providerId,
      currentModelId: resolvedModelId,
    });
  },
}));
