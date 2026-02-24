import { useAgentStore } from "../../stores/agentStore";
import { useAppStore } from "../../stores/appStore";
import { Settings, Brain } from "lucide-react";
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

export default function TopBar() {
  const { selectedAgent } = useAgentStore();
  const { toggleSettings } = useAppStore();
  const [memoryOpen, setMemoryOpen] = useState(false);

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b px-3 shrink-0">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          {selectedAgent ? (
            <div className="flex items-center gap-2 ml-1">
              <span className="text-base">{selectedAgent.icon}</span>
              <div>
                <h2 className="text-sm font-semibold leading-tight">
                  {selectedAgent.name}
                </h2>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {selectedAgent.description}
                </p>
              </div>
            </div>
          ) : (
            <h2 className="text-sm font-semibold ml-1">Home</h2>
          )}
        </div>

        <div className="flex items-center gap-1">
          <ModelSelector />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
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
