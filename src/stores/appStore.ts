import { create } from 'zustand';
import type { AppSettings } from '../lib/types';
import { getSettings, saveSettings as saveTauriSettings } from '../lib/tauri';

type View = 'onboarding' | 'home' | 'chat' | 'settings' | 'analytics' | 'knowledge';

interface AppState {
  settings: AppSettings;
  currentView: View;
  settingsOpen: boolean;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (s: Partial<AppSettings>) => Promise<void>;
  setView: (v: View) => void;
  toggleSettings: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: { apiKey: '', role: 'admin', theme: 'dark', onboardingComplete: false },
  currentView: 'onboarding',
  settingsOpen: false,
  loaded: false,
  loadSettings: async () => {
    const s = await getSettings();
    set({ settings: s, currentView: s.onboardingComplete ? 'home' : 'onboarding', loaded: true });
  },
  updateSettings: async (partial) => {
    const updated = { ...get().settings, ...partial };
    await saveTauriSettings(updated);
    set({ settings: updated });
  },
  setView: (v) => set({ currentView: v }),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
}));
