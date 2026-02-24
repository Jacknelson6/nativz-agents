import { useState, useEffect } from "react";
import {
  Settings,
  Brain,
  BookOpen,
  Plus,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useAgentStore } from "../../stores/agentStore";
import { useAppStore } from "../../stores/appStore";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { agents, selectAgent } = useAgentStore();
  const { setView, toggleSettings } = useAppStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const runAction = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search actions, agents, settings..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() =>
              runAction(() => {
                setView("chat");
              })
            }
          >
            <Plus size={16} className="mr-2" />
            New Chat
          </CommandItem>
          <CommandItem onSelect={() => runAction(toggleSettings)}>
            <Settings size={16} className="mr-2" />
            Open Settings
          </CommandItem>
          <CommandItem
            onSelect={() => runAction(() => setView("analytics"))}
          >
            <Zap size={16} className="mr-2" />
            View Analytics
          </CommandItem>
          <CommandItem
            onSelect={() => runAction(() => setView("home"))}
          >
            <ArrowRight size={16} className="mr-2" />
            Go Home
          </CommandItem>
          <CommandItem
            onSelect={() => runAction(() => setView("knowledge"))}
          >
            <BookOpen size={16} className="mr-2" />
            Knowledge Browser
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Agents">
          {agents.map((agent) => (
            <CommandItem
              key={agent.id}
              onSelect={() =>
                runAction(() => {
                  selectAgent(agent);
                  setView("chat");
                })
              }
            >
              <span className="mr-2 text-base">{agent.icon}</span>
              <div>
                <p className="text-sm font-medium">{agent.name}</p>
                <p className="text-xs text-muted-foreground">
                  {agent.description}
                </p>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Memory">
          <CommandItem onSelect={() => setOpen(false)}>
            <Brain size={16} className="mr-2" />
            Search Memory
          </CommandItem>
          <CommandItem onSelect={() => setOpen(false)}>
            <BookOpen size={16} className="mr-2" />
            Browse Knowledge Base
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
