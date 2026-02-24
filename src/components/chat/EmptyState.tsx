import { useAgentStore } from '../../stores/agentStore';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const AGENT_PROMPTS: Record<string, string[]> = {
  seo: [
    'Audit example.com for SEO issues',
    'Research keywords for "AI marketing tools"',
    'Write meta descriptions for our landing pages',
    'Analyze our competitors\' backlink profiles',
    'Create a content calendar for Q2',
  ],
  'paid-media': [
    'Create a Google Ads campaign for our SaaS product',
    'Analyze our Facebook ad performance this month',
    'Write 5 ad copy variations for our new feature',
    'Set up conversion tracking for our landing page',
    'Suggest budget allocation across channels',
  ],
  'social-media': [
    'Draft a week of Instagram posts for our brand',
    'Analyze trending hashtags in our industry',
    'Create a TikTok content strategy',
    'Write engaging LinkedIn posts about AI',
    'Schedule a month of social content',
  ],
  content: [
    'Write a blog post about AI in marketing',
    'Create an email newsletter draft',
    'Generate 10 headline variations for our article',
    'Outline a whitepaper on digital transformation',
    'Edit this draft for clarity and engagement',
  ],
  analytics: [
    'Summarize our Google Analytics data for last month',
    'Create a dashboard report for stakeholders',
    'Identify our top-performing content pieces',
    'Track conversion rates across our funnel',
    'Compare this quarter vs last quarter metrics',
  ],
  developer: [
    'Set up a CI/CD pipeline for our project',
    'Review this code for performance issues',
    'Write unit tests for the auth module',
    'Debug this API endpoint returning 500 errors',
    'Create a REST API design for user management',
  ],
};

const DEFAULT_PROMPTS = [
  'Help me brainstorm ideas for...',
  'Analyze this data and find insights',
  'Write a professional email about...',
  'Create a step-by-step plan for...',
  'Summarize this document for me',
];

function getPrompts(agentId: string): string[] {
  // Match by category-like id
  for (const [key, prompts] of Object.entries(AGENT_PROMPTS)) {
    if (agentId.toLowerCase().includes(key)) return prompts;
  }
  return DEFAULT_PROMPTS;
}

export default function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  const { selectedAgent, agents, selectAgent } = useAgentStore();

  // No agent selected: show agent picker cards
  if (!selectedAgent) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Sparkles className="w-10 h-10 text-blue-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Choose an Agent</h2>
        <p className="text-sm text-neutral-400 mb-8 max-w-md text-center">
          Select a specialized AI agent to get started. Each agent is tuned for specific tasks.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg w-full">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => selectAgent(agent)}
              className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200"
            >
              <span className="text-2xl">{agent.icon}</span>
              <span className="text-sm font-medium text-white">{agent.name}</span>
              <span className="text-xs text-neutral-500 line-clamp-2">{agent.description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Agent selected but no messages: show suggested prompts
  const prompts = getPrompts(selectedAgent.id);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="text-5xl mb-4">{selectedAgent.icon}</div>
      <h2 className="text-lg font-semibold text-white mb-1">{selectedAgent.name}</h2>
      <p className="text-sm text-neutral-400 mb-8 max-w-md text-center">{selectedAgent.description}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
        {prompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSelectPrompt(prompt)}
            className="text-left px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-xl text-sm text-neutral-300 hover:text-white transition-all duration-200"
          >
            <span className="text-blue-400 mr-2">→</span>
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
