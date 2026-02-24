import { useAgentStore } from '../../stores/agentStore';
import { useAppStore } from '../../stores/appStore';
import { Settings, Brain } from 'lucide-react';
import ModelSelector from '../chat/ModelSelector';
import { useState } from 'react';
import MemoryInspector from '../memory/MemoryInspector';

export default function TopBar() {
  const { selectedAgent } = useAgentStore();
  const { toggleSettings } = useAppStore();
  const [memoryOpen, setMemoryOpen] = useState(false);

  return (
    <>
      <div className="h-14 border-b border-border flex items-center justify-between px-5">
        <div>
          {selectedAgent ? (
            <>
              <h2 className="text-sm font-semibold">{selectedAgent.icon} {selectedAgent.name}</h2>
              <p className="text-xs text-muted">{selectedAgent.description}</p>
            </>
          ) : (
            <h2 className="text-sm font-semibold">Home</h2>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector />
          <button
            onClick={() => setMemoryOpen(true)}
            className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
            title="Memory Inspector"
          >
            <Brain size={18} />
          </button>
          <button
            onClick={toggleSettings}
            className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
      {memoryOpen && <MemoryInspector onClose={() => setMemoryOpen(false)} />}
    </>
  );
}
