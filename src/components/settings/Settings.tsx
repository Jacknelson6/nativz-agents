import { useState, useEffect, useRef } from "react";
import { useAppStore } from "../../stores/appStore";
import { Key, Palette, Info, Server, Download, Upload, BarChart3 } from "lucide-react";
import ProviderConfig from "./ProviderConfig";
import { exportAllData, downloadExport, importData, readFileAsText } from "../../lib/dataManager";
import { emitNotification } from "../layout/NotificationCenter";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const { settings, updateSettings, toggleSettings, settingsOpen } = useAppStore();
  const [apiKey, setApiKey] = useState(settings.apiKey);

  // Reset local state when sheet opens
  useEffect(() => {
    if (settingsOpen) setApiKey(settings.apiKey);
  }, [settingsOpen, settings.apiKey]);

  const importRef = useRef<HTMLInputElement>(null);

  const handleSaveKey = () => {
    updateSettings({ apiKey });
  };

  const handleExport = () => {
    const data = exportAllData();
    downloadExport(data);
    emitNotification({ type: 'success', title: 'Data Exported', message: 'Your data has been exported successfully.' });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await readFileAsText(file);
    const result = importData(text);
    emitNotification({ type: result.success ? 'success' : 'error', title: result.success ? 'Import Complete' : 'Import Failed', message: result.message });
    if (importRef.current) importRef.current.value = '';
  };

  return (
    <Sheet open={settingsOpen} onOpenChange={toggleSettings}>
      <SheetContent className="w-full max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Configure your app preferences and providers.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="general" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1 gap-1.5">
              <Key size={13} />
              General
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex-1 gap-1.5">
              <Server size={13} />
              Providers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            {/* API Key */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Key size={14} /> API Key
              </div>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
              />
              <Button size="sm" variant="secondary" onClick={handleSaveKey}>
                Save
              </Button>
            </section>

            <Separator />

            {/* Theme */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Palette size={14} /> Theme
              </div>
              <div className="flex gap-2">
                {(["dark", "light"] as const).map((t) => (
                  <Button
                    key={t}
                    variant={settings.theme === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSettings({ theme: t })}
                    className="capitalize"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </section>

            <Separator />

            {/* Developer Stats */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 size={14} /> Developer Stats
              </div>
              <p className="text-xs text-muted-foreground">
                Show token usage and cost estimates in the status bar.
              </p>
              <div className="flex gap-2">
                {([true, false] as const).map((val) => (
                  <Button
                    key={String(val)}
                    variant={!!settings.showDevStats === val ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSettings({ showDevStats: val })}
                  >
                    {val ? "Show" : "Hide"}
                  </Button>
                ))}
              </div>
            </section>

            <Separator />

            {/* Data Management */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Download size={14} /> Data Management
              </div>
              <p className="text-xs text-muted-foreground">Export or import your data for backup.</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
                  <Download size={12} />
                  Export Data
                </Button>
                <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} className="gap-1.5">
                  <Upload size={12} />
                  Import Data
                </Button>
                <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
              </div>
              <p className="text-[10px] text-muted-foreground">Import will merge with existing data.</p>
            </section>

            <Separator />

            {/* About */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info size={14} /> About
              </div>
              <p className="text-xs text-muted-foreground">
                Nativz SEO v1.0.0
              </p>
              <p className="text-xs text-muted-foreground/60">
                Built with Tauri + React + Claude
              </p>
            </section>
          </TabsContent>

          <TabsContent value="providers" className="mt-6">
            <ProviderConfig />
          </TabsContent>

        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
