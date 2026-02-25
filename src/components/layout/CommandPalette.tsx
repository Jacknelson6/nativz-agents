import { useState, useEffect } from "react";
import {
  Settings,
  BookOpen,
  Plus,
  BarChart3,
  Trash2,
  Copy,
  Home,
  Wrench,
  Keyboard,
} from "lucide-react";
import { useAgentStore } from "../../stores/agentStore";
import { useAppStore } from "../../stores/appStore";
import { useChatStore } from "../../stores/chatStore";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { agents, selectAgent } = useAgentStore();
  const { setView, toggleSettings } = useAppStore();
  const { messages, clearMessages, currentAgentId } = useChatStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const runAction = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  const handleCopyLastResponse = () => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.content);
    if (lastAssistant) {
      navigator.clipboard.writeText(lastAssistant.content);
    }
  };

  const handleClearChat = () => {
    if (currentAgentId) {
      clearMessages(currentAgentId);
    } else {
      clearMessages();
    }
  };

  const hasMessages = messages.length > 0;
  const hasAssistantMessage = messages.some((m) => m.role === "assistant" && m.content);

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search actions, settings..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() =>
                runAction(() => {
                  if (currentAgentId) clearMessages(currentAgentId);
                  selectAgent(null);
                  setView("home");
                })
              }
            >
              <Plus size={16} className="mr-2" />
              New Chat
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runAction(toggleSettings)}>
              <Settings size={16} className="mr-2" />
              Open Settings
              <CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => runAction(() => setView("home"))}
            >
              <Home size={16} className="mr-2" />
              Go Home
            </CommandItem>
            <CommandItem
              onSelect={() => runAction(() => setView("knowledge"))}
            >
              <BookOpen size={16} className="mr-2" />
              Knowledge Base
            </CommandItem>
            <CommandItem
              onSelect={() => runAction(() => setView("analytics"))}
            >
              <BarChart3 size={16} className="mr-2" />
              Usage Analytics
            </CommandItem>
            <CommandItem
              onSelect={() => runAction(() => setView("tools"))}
            >
              <Wrench size={16} className="mr-2" />
              SEO Tools
            </CommandItem>
            <CommandItem onSelect={() => runAction(() => setShortcutsOpen(true))}>
              <Keyboard size={16} className="mr-2" />
              Keyboard Shortcuts
              <CommandShortcut>⌘/</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          {hasMessages && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Chat">
                {hasAssistantMessage && (
                  <CommandItem onSelect={() => runAction(handleCopyLastResponse)}>
                    <Copy size={16} className="mr-2" />
                    Copy Last Response
                  </CommandItem>
                )}
                <CommandItem onSelect={() => runAction(handleClearChat)}>
                  <Trash2 size={16} className="mr-2" />
                  Clear Chat
                </CommandItem>
              </CommandGroup>
            </>
          )}

          <CommandSeparator />

          <CommandGroup heading="Agent">
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
        </CommandList>
      </CommandDialog>

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { keys: '⌘K', description: 'Command Palette' },
              { keys: '⌘N', description: 'New Chat' },
              { keys: '⌘,', description: 'Settings' },
              { keys: '⌘/', description: 'Keyboard Shortcuts' },
              { keys: 'Enter', description: 'Send message' },
              { keys: 'Shift+Enter', description: 'New line in message' },
              { keys: 'Escape', description: 'Close panels / dialogs' },
            ].map(({ keys, description }) => (
              <div key={keys} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{description}</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded-md text-muted-foreground">
                  {keys}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
