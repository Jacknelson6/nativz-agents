import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { X, Key, User, Palette, Info, Server } from 'lucide-react';
import ProviderConfig from './ProviderConfig';

type SettingsTab = 'general' | 'providers';

export default function Settings() {
  const { settings, updateSettings, toggleSettings } = useAppStore();
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const handleSaveKey = () => {
    updateSettings({ apiKey });
  };

  const tabs: { id: SettingsTab; label: string; icon: typeof Key }[] = [
    { id: 'general', label: 'General', icon: Key },
    { id: 'providers', label: 'Providers', icon: Server },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={toggleSettings} />
      <div className="relative ml-auto w-full max-w-lg bg-zinc-900 border-l border-zinc-800/50 h-full overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/50">
          <h2 className="text-[15px] font-semibold text-zinc-100">Settings</h2>
          <button onClick={toggleSettings} className="p-1.5 rounded-lg hover:bg-zinc-800/60 text-zinc-500 hover:text-zinc-200 transition-colors duration-150">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800/50 px-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] border-b-2 transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-200'
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* API Key */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-[13px] font-medium text-zinc-200">
                  <Key size={13} /> API Key
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-[13px] text-zinc-100 outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/50 transition-all duration-200 placeholder:text-zinc-600"
                />
                <button onClick={handleSaveKey} className="mt-2 text-[12px] text-blue-400 hover:text-blue-300 transition-colors">Save</button>
              </section>

              {/* Role */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-[13px] font-medium text-zinc-200">
                  <User size={13} /> Role
                </div>
                <select
                  value={settings.role}
                  onChange={(e) => updateSettings({ role: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-[13px] text-zinc-100 outline-none focus:border-zinc-700 transition-colors"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="paid-media">Paid Media</option>
                  <option value="account-manager">Account Manager</option>
                  <option value="developer">Developer</option>
                </select>
              </section>

              {/* Theme */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-[13px] font-medium text-zinc-200">
                  <Palette size={13} /> Theme
                </div>
                <div className="flex gap-2">
                  {(['dark', 'light'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => updateSettings({ theme: t })}
                      className={`px-4 py-2 rounded-lg text-[13px] capitalize border transition-colors duration-150 ${
                        settings.theme === t
                          ? 'border-blue-500/50 text-blue-400 bg-blue-500/10'
                          : 'border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </section>

              {/* About */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-[13px] font-medium text-zinc-200">
                  <Info size={13} /> About
                </div>
                <p className="text-[12px] text-zinc-500">Nativz Agents v0.1.0</p>
                <p className="text-[12px] text-zinc-600 mt-0.5">Built with Tauri + React + Claude</p>
              </section>
            </div>
          )}

          {activeTab === 'providers' && <ProviderConfig />}
        </div>
      </div>
    </div>
  );
}
