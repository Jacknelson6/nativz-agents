import { create } from 'zustand';
import type { Provider } from '../lib/types';
import { listProviders, setProvider as setTauriProvider } from '../lib/tauri';

interface ModelState {
  currentProviderId: string | null;
  currentModelId: string | null;
  availableProviders: Provider[];
  loading: boolean;
  refreshProviders: () => Promise<void>;
  setProvider: (providerId: string, modelId: string) => Promise<void>;
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

  setProvider: async (providerId, modelId) => {
    await setTauriProvider(providerId, modelId);
    set({ currentProviderId: providerId, currentModelId: modelId });
  },
}));
