import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { AppSettings } from '../lib/types';
import { getSettings, saveSettings as saveTauriSettings } from '../lib/tauri';
import { emitNotification } from '../components/layout/NotificationCenter';

type View = 'onboarding' | 'home' | 'chat' | 'settings' | 'knowledge' | 'analytics' | 'tools' | 'agent-select' | 'marketplace';
type SidecarStatus = 'connected' | 'crashed' | 'reconnecting';

interface AppState {
  settings: AppSettings;
  currentView: View;
  settingsOpen: boolean;
  loaded: boolean;
  sidecarStatus: SidecarStatus;
  loadSettings: () => Promise<void>;
  updateSettings: (s: Partial<AppSettings>) => Promise<void>;
  setView: (v: View) => void;
  toggleSettings: () => void;
  startHealthCheck: () => void;
  stopHealthCheck: () => void;
}

// Health check state
let healthCheckInterval: ReturnType<typeof setInterval> | null = null;
let failCount = 0;

// Listen for sidecar crash/reconnect events
let sidecarListenerSetup = false;
function setupSidecarListener() {
  if (sidecarListenerSetup) return;
  sidecarListenerSetup = true;
  listen<string>('sidecar-crashed', () => {
    useAppStore.setState({ sidecarStatus: 'crashed' });
    // Auto-reconnect happens on next request (Rust side),
    // so set back to connected after a brief delay
    setTimeout(() => {
      useAppStore.setState({ sidecarStatus: 'reconnecting' });
    }, 500);
    setTimeout(() => {
      useAppStore.setState({ sidecarStatus: 'connected' });
    }, 2000);
  });
}

export const useAppStore = create<AppState>((set, get) => {
  setupSidecarListener();
  return {
    settings: { apiKey: '', role: 'admin', theme: 'dark', onboardingComplete: false },
    currentView: 'onboarding',
    settingsOpen: false,
    loaded: false,
    sidecarStatus: 'connected',
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
    startHealthCheck: () => {
      if (healthCheckInterval) return;
      healthCheckInterval = setInterval(async () => {
        try {
          await invoke('ping_sidecar');
          failCount = 0;
          if (get().sidecarStatus !== 'connected') {
            set({ sidecarStatus: 'connected' });
            emitNotification({
              type: 'success',
              title: 'Reconnected',
              message: 'Agent runtime connection restored.',
              autoDismissMs: 3000,
            });
          }
        } catch {
          failCount++;
          if (failCount >= 3 && get().sidecarStatus === 'connected') {
            set({ sidecarStatus: 'crashed' });
            emitNotification({
              type: 'error',
              title: 'Connection Lost',
              message: 'Agent runtime is not responding. Attempting to reconnect...',
            });
          }
          if (failCount >= 3) {
            set({ sidecarStatus: 'reconnecting' });
          }
        }
      }, 30000);
    },
    stopHealthCheck: () => {
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
      }
    },
  };
});
