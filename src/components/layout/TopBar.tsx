import { useAgentStore } from "../../stores/agentStore";
import ModelSelector from "../chat/ModelSelector";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChevronDown } from "lucide-react";

export default function TopBar() {
  const { selectedAgent } = useAgentStore();

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div className="h-4 w-px bg-border/50 mx-1" />
        {selectedAgent && (
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedAgent.icon}</span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors">
              <span className="font-semibold text-sm">{selectedAgent.name}</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ModelSelector />
      </div>
    </header>
  );
}
