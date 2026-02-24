import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { X, Key, User, Palette, Info } from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings, toggleSettings } = useAppStore();
  const [apiKey, setApiKey] = useState(settings.apiKey);

  const handleSaveKey = () => {
    updateSettings({ apiKey });
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={toggleSettings} />
      <div className="relative ml-auto w-full max-w-md bg-surface border-l border-border h-full overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">Settings</h2>
          <button onClick={toggleSettings} className="p-1.5 rounded-lg hover:bg-white/5 text-muted hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* API Key */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-sm font-medium"><Key size={14} /> API Key</div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-black border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent/50"
            />
            <button onClick={handleSaveKey} className="mt-2 text-xs text-accent hover:underline">Save</button>
          </section>

          {/* Role */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-sm font-medium"><User size={14} /> Role</div>
            <select
              value={settings.role}
              onChange={(e) => updateSettings({ role: e.target.value as any })}
              className="w-full bg-black border border-border rounded-lg px-3 py-2 text-sm outline-none"
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
            <div className="flex items-center gap-2 mb-3 text-sm font-medium"><Palette size={14} /> Theme</div>
            <div className="flex gap-2">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => updateSettings({ theme: t })}
                  className={`px-4 py-2 rounded-lg text-sm capitalize border ${
                    settings.theme === t ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {/* About */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-sm font-medium"><Info size={14} /> About</div>
            <p className="text-xs text-muted">Nativz Agents v0.1.0</p>
            <p className="text-xs text-muted">Built with Tauri + React + Claude</p>
          </section>
        </div>
      </div>
    </div>
  );
}
