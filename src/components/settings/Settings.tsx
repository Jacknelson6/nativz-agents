import { useState } from "react";
import { useAppStore } from "../../stores/appStore";
import { Key, User, Palette, Info, Server } from "lucide-react";
import ProviderConfig from "./ProviderConfig";
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

  const handleSaveKey = () => {
    updateSettings({ apiKey });
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

            {/* Role */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User size={14} /> Role
              </div>
              <select
                value={settings.role}
                onChange={(e) =>
                  updateSettings({ role: e.target.value as any })
                }
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="paid-media">Paid Media</option>
                <option value="account-manager">Account Manager</option>
                <option value="developer">Developer</option>
              </select>
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

            {/* About */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info size={14} /> About
              </div>
              <p className="text-xs text-muted-foreground">
                Nativz Agents v0.1.0
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
