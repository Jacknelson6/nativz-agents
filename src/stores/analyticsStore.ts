import { create } from 'zustand';
import type { UsageStats, CostStats } from '../lib/types';
import { getUsageStats, getCostStats } from '../lib/tauri';

interface AnalyticsState {
  usageStats: UsageStats | null;
  costStats: CostStats | null;
  loading: boolean;
  refreshStats: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  usageStats: null,
  costStats: null,
  loading: false,

  refreshStats: async () => {
    set({ loading: true });
    try {
      const [usage, cost] = await Promise.all([getUsageStats(), getCostStats()]);
      set({ usageStats: usage, costStats: cost, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
