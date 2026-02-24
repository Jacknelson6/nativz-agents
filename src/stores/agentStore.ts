import { create } from 'zustand';
import type { Agent } from '../lib/types';
import { getAgents } from '../lib/tauri';

interface AgentState {
  agents: Agent[];
  selectedAgent: Agent | null;
  loadAgents: () => Promise<void>;
  selectAgent: (agent: Agent | null) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  selectedAgent: null,
  loadAgents: async () => {
    const agents = await getAgents();
    set({ agents });
  },
  selectAgent: (agent) => set({ selectedAgent: agent }),
}));
