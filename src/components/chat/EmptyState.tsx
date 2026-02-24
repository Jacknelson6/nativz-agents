import { useAgentStore } from '../../stores/agentStore';
import { Sparkles, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const AGENT_PROMPTS: Record<string, string[]> = {
  seo: [
    'Audit example.com for SEO issues',
    'Research keywords for "AI marketing tools"',
    'Write meta descriptions for our landing pages',
    'Analyze our competitors\' backlink profiles',
  ],
  'paid-media': [
    'Create a Google Ads campaign for our SaaS product',
    'Analyze our Facebook ad performance this month',
    'Write 5 ad copy variations for our new feature',
    'Suggest budget allocation across channels',
  ],
  'social-media': [
    'Draft a week of Instagram posts for our brand',
    'Analyze trending hashtags in our industry',
    'Create a TikTok content strategy',
    'Write engaging LinkedIn posts about AI',
  ],
  content: [
    'Write a blog post about AI in marketing',
    'Create an email newsletter draft',
    'Generate 10 headline variations for our article',
    'Outline a whitepaper on digital transformation',
  ],
  analytics: [
    'Summarize our Google Analytics data for last month',
    'Create a dashboard report for stakeholders',
    'Identify our top-performing content pieces',
    'Compare this quarter vs last quarter metrics',
  ],
  developer: [
    'Set up a CI/CD pipeline for our project',
    'Review this code for performance issues',
    'Write unit tests for the auth module',
    'Debug this API endpoint returning 500 errors',
  ],
};

const DEFAULT_PROMPTS = [
  'Help me brainstorm ideas for...',
  'Analyze this data and find insights',
  'Write a professional email about...',
  'Create a step-by-step plan for...',
];

function getPrompts(agentId: string): string[] {
  for (const [key, prompts] of Object.entries(AGENT_PROMPTS)) {
    if (agentId.toLowerCase().includes(key)) return prompts;
  }
  return DEFAULT_PROMPTS;
}

export default function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  const { selectedAgent, agents, selectAgent } = useAgentStore();

  if (!selectedAgent) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-5">
          <Sparkles className="w-6 h-6 text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-1.5">Choose an Agent</h2>
        <p className="text-[13px] text-zinc-500 mb-8 max-w-sm text-center leading-relaxed">
          Select a specialized AI agent to get started. Each agent is tuned for specific tasks.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-lg w-full">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => selectAgent(agent)}
              className="flex flex-col items-center gap-2 p-4 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all duration-150"
            >
              <span className="text-xl">{agent.icon}</span>
              <span className="text-[12px] font-medium text-zinc-200">{agent.name}</span>
              <span className="text-[10px] text-zinc-500 line-clamp-2 text-center">{agent.description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const prompts = getPrompts(selectedAgent.id);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="text-4xl mb-4">{selectedAgent.icon}</div>
      <h2 className="text-lg font-semibold text-zinc-100 mb-1">{selectedAgent.name}</h2>
      <p className="text-[13px] text-zinc-500 mb-8 max-w-md text-center leading-relaxed">{selectedAgent.description}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
        {prompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSelectPrompt(prompt)}
            className="group text-left px-4 py-3.5 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl text-[13px] text-zinc-400 hover:text-zinc-200 transition-all duration-150"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="line-clamp-2">{prompt}</span>
              <ArrowRight size={13} className="text-zinc-700 group-hover:text-blue-400 shrink-0 transition-colors duration-150" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
