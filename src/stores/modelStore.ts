import { create } from 'zustand';
import type { Provider } from '../lib/types';
import { listProviders, setProvider as setTauriProvider } from '../lib/tauri';

interface ModelState {
  currentProviderId: string | null;
  currentModelId: string | null;
  availableProviders: Provider[];
  loading: boolean;
  refreshProviders: () => Promise<void>;
  setProvider: (agentId: string, providerId: string) => Promise<void>;
}

export const useModelStore = create<ModelState>((set) => ({
  currentProviderId: null,
  currentModelId: null,
  availableProviders: [],
  loading: false,

  refreshProviders: async () => {
    set({ loading: true });
    try {
      const providers = await listProviders();
      set({ availableProviders: providers, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setProvider: async (agentId, providerId) => {
    await setTauriProvider(agentId, providerId);
    set({ currentProviderId: providerId });
  },
}));
