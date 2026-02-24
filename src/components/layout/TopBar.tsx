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
      <div className="h-12 border-b border-zinc-800/50 flex items-center justify-between px-5 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          {selectedAgent ? (
            <>
              <span className="text-base">{selectedAgent.icon}</span>
              <div>
                <h2 className="text-[13px] font-semibold text-zinc-100 leading-tight">{selectedAgent.name}</h2>
                <p className="text-[11px] text-zinc-500 leading-tight">{selectedAgent.description}</p>
              </div>
            </>
          ) : (
            <h2 className="text-[13px] font-semibold text-zinc-100">Home</h2>
          )}
        </div>
        <div className="flex items-center gap-1">
          <ModelSelector />
          <button
            onClick={() => setMemoryOpen(true)}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors duration-150"
            title="Memory Inspector"
          >
            <Brain size={16} />
          </button>
          <button
            onClick={toggleSettings}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors duration-150"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
      {memoryOpen && <MemoryInspector onClose={() => setMemoryOpen(false)} />}
    </>
  );
}
