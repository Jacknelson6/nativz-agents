import { Server, Activity, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useModelStore } from "../../stores/modelStore";
import { useChatStore } from "../../stores/chatStore";

export default function StatusBar() {
  const { sidecarStatus } = useAppStore();
  const { currentProviderId, currentModelId, availableProviders } = useModelStore();
  const { messages } = useChatStore();
  
  const provider = availableProviders.find(p => p.id === currentProviderId);
  const model = provider?.models.find(m => m.id === currentModelId);
  const modelName = model?.name || currentModelId;

  return (
    <footer className="h-6 border-t bg-muted/30 flex items-center justify-between px-3 text-[10px] text-muted-foreground select-none shrink-0 font-medium">
      <div className="flex items-center gap-4">
        {/* Sidecar Status */}
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
            sidecarStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]' : 
            sidecarStatus === 'reconnecting' ? 'bg-amber-500 animate-pulse' : 
            'bg-red-500 animate-pulse'
          }`} />
          <span className="flex items-center gap-1">
            Runtime: {sidecarStatus === 'connected' ? 'Ready' : sidecarStatus === 'reconnecting' ? 'Reconnecting' : 'Offline'}
          </span>
        </div>

        {/* Active Model */}
        <div className="flex items-center gap-1.5 border-l border-border/50 pl-4">
          <Server size={10} className="text-muted-foreground/70" />
          <span className="truncate max-w-[150px]">
            {provider ? `${provider.name} / ${modelName}` : 'No model selected'}
          </span>
        </div>

        {/* API Health */}
        {provider && (
          <div className="flex items-center gap-1.5 border-l border-border/50 pl-4">
            {provider.health.status === 'healthy' ? <Wifi size={10} className="text-emerald-500" /> : <WifiOff size={10} className="text-amber-500" />}
            <span className={provider.health.status === 'healthy' ? 'text-emerald-500/80' : 'text-amber-500/80'}>
              {provider.health.status} {provider.health.latencyMs ? `(${provider.health.latencyMs}ms)` : ''}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Turn Stats */}
        <div className="flex items-center gap-3 mr-2">
          <div className="flex items-center gap-1">
            <Activity size={10} />
            <span>{messages.length} messages</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 border-l border-border/50 pl-4">
          <ShieldCheck size={10} />
          <span>v3.0.0 Stable</span>
        </div>
      </div>
    </footer>
  );
}