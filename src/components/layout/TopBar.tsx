import { useAgentStore } from "../../stores/agentStore";
import { useChatStore } from "../../stores/chatStore";
import { useAppStore } from "../../stores/appStore";
import { Settings, Brain, ChevronDown, Check, Plus } from "lucide-react";
import ModelSelector from "../chat/ModelSelector";
import { useState } from "react";
import MemoryInspector from "../memory/MemoryInspector";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TopBar() {
  const { agents, selectedAgent, selectAgent } = useAgentStore();
  const { toggleSettings, setView } = useAppStore();
  const [memoryOpen, setMemoryOpen] = useState(false);
  const clearMessages = useChatStore((s) => s.clearMessages);

  const handleNewChat = () => {
    if (!selectedAgent) return;
    clearMessages(selectedAgent.id);
    setView("chat");
  };

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b px-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          {selectedAgent ? (
            agents.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 ml-1 text-sm font-medium hover:text-primary transition-colors">
                    <span className="text-base">{selectedAgent.icon}</span>
                    <span>{selectedAgent.name}</span>
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {agents.map((agent) => (
                    <DropdownMenuItem
                      key={agent.id}
                      onClick={() => {
                        selectAgent(agent);
                        setView("chat");
                      }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-base">{agent.icon}</span>
                      <span>{agent.name}</span>
                      {agent.id === selectedAgent.id && (
                        <Check size={14} className="ml-auto text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 ml-1 min-w-0">
                <span className="text-base">{selectedAgent.icon}</span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold leading-tight">
                    {selectedAgent.name}
                  </h2>
                  <p className="text-[11px] text-muted-foreground leading-tight truncate max-w-[300px]">
                    {selectedAgent.description}
                  </p>
                </div>
              </div>
            )
          ) : (
            <h2 className="text-sm font-semibold ml-1">Home</h2>
          )}
        </div>

        <div className="flex items-center gap-1">
          {selectedAgent && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="New Chat"
                  onClick={handleNewChat}
                >
                  <Plus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Chat</TooltipContent>
            </Tooltip>
          )}
          <ModelSelector />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Memory Inspector"
                onClick={() => setMemoryOpen(true)}
              >
                <Brain size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Memory Inspector</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Settings"
                onClick={toggleSettings}
              >
                <Settings size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
      </header>
      {memoryOpen && (
        <MemoryInspector onClose={() => setMemoryOpen(false)} />
      )}
    </>
  );
}
