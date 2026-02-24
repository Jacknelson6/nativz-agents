import { useState, useMemo } from 'react';
import {
  Store, Search, Star, Download, Copy, Plus, ChevronRight,
  Brain, Globe, PenTool, BarChart3, Megaphone, Wrench,
  Users, Sparkles, Lock, ExternalLink,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface MarketplaceAgent {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: string;
  category: AgentCategory;
  capabilities: string[];
  tools: string[];
  knowledgeSize: string;
  author: string;
  version: string;
  installed: boolean;
  starred: boolean;
  installCount: number;
  tags: string[];
}

type AgentCategory = 'marketing' | 'analytics' | 'content' | 'development' | 'productivity';

interface AgentMarketplaceProps {
  onCreateFromTemplate?: (agentId: string) => void;
}

// ── Agent Data ─────────────────────────────────────────────────────────────

const MARKETPLACE_AGENTS: MarketplaceAgent[] = [
  {
    id: 'seo',
    name: 'SEO Specialist',
    description: 'Technical SEO audits, keyword research, and content optimization.',
    longDescription: 'Full-stack SEO agent that performs technical audits, researches keywords using real-time SERP data, optimizes on-page elements, and tracks ranking progress. Integrates with Google Search Console and Analytics.',
    icon: '🔍',
    category: 'marketing',
    capabilities: ['Technical SEO Audit', 'Keyword Research', 'Content Optimization', 'Rank Tracking', 'Competitor Analysis'],
    tools: ['web-search', 'web-crawl', 'file-write'],
    knowledgeSize: '2.4 MB',
    author: 'Nativz',
    version: '1.0.0',
    installed: true,
    starred: false,
    installCount: 0,
    tags: ['seo', 'marketing', 'audit'],
  },
  {
    id: 'ads',
    name: 'Paid Media Manager',
    description: 'Campaign strategy, ad copy, budget optimization across platforms.',
    longDescription: 'Manages paid media across Google Ads, Meta, TikTok, and LinkedIn. Creates ad copy variations, suggests budget allocations, analyzes ROAS, and generates performance reports with actionable recommendations.',
    icon: '📊',
    category: 'analytics',
    capabilities: ['Campaign Strategy', 'Ad Copy Generation', 'Budget Optimization', 'ROAS Analysis', 'A/B Test Recommendations'],
    tools: ['web-search', 'data-analysis', 'file-write'],
    knowledgeSize: '1.8 MB',
    author: 'Nativz',
    version: '1.0.0',
    installed: true,
    starred: false,
    installCount: 0,
    tags: ['ads', 'ppc', 'media'],
  },
  {
    id: 'content-editor',
    name: 'Content Editor',
    description: 'Blog posts, social media, email campaigns, and content calendars.',
    longDescription: 'Creates and edits content across all channels — blog posts, social media captions, email sequences, and video scripts. Maintains brand voice consistency and optimizes for engagement metrics.',
    icon: '✍️',
    category: 'content',
    capabilities: ['Blog Writing', 'Social Media', 'Email Campaigns', 'Content Calendar', 'Brand Voice'],
    tools: ['web-search', 'file-write', 'file-read'],
    knowledgeSize: '3.1 MB',
    author: 'Nativz',
    version: '1.0.0',
    installed: true,
    starred: false,
    installCount: 0,
    tags: ['content', 'writing', 'social'],
  },
  {
    id: 'account-manager',
    name: 'Account Manager',
    description: 'Client communications, reporting, and relationship management.',
    longDescription: 'Handles client-facing communications, generates monthly performance reports, drafts professional emails, prepares meeting agendas, and tracks deliverables across all accounts.',
    icon: '🤝',
    category: 'productivity',
    capabilities: ['Client Reporting', 'Email Drafts', 'Meeting Prep', 'Deliverable Tracking', 'QBR Preparation'],
    tools: ['web-search', 'file-write', 'email-send'],
    knowledgeSize: '1.2 MB',
    author: 'Nativz',
    version: '1.0.0',
    installed: true,
    starred: false,
    installCount: 0,
    tags: ['account', 'client', 'reporting'],
  },
  {
    id: 'diy',
    name: 'DIY Assistant',
    description: 'General-purpose agent — customize for any task.',
    longDescription: 'A blank-slate agent you can configure for any purpose. Add custom system prompts, knowledge bases, and tool access to create a specialized assistant for your unique workflows.',
    icon: '🛠️',
    category: 'productivity',
    capabilities: ['Custom Workflows', 'Flexible Prompting', 'Tool Integration', 'Knowledge Upload'],
    tools: ['web-search', 'file-read', 'file-write', 'browser'],
    knowledgeSize: '0 KB',
    author: 'Nativz',
    version: '1.0.0',
    installed: true,
    starred: false,
    installCount: 0,
    tags: ['custom', 'general', 'diy'],
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Analyze datasets, create visualizations, find insights.',
    longDescription: 'Advanced data analysis agent that processes CSV/JSON datasets, generates statistical summaries, identifies trends, and creates actionable insights. Perfect for marketing analytics, financial data, and performance tracking.',
    icon: '📈',
    category: 'analytics',
    capabilities: ['Statistical Analysis', 'Trend Detection', 'Data Visualization', 'Anomaly Detection', 'Forecasting'],
    tools: ['data-analysis', 'file-read', 'file-write', 'code-exec'],
    knowledgeSize: '0.8 MB',
    author: 'Community',
    version: '0.9.0',
    installed: false,
    starred: false,
    installCount: 0,
    tags: ['data', 'analytics', 'visualization'],
  },
  {
    id: 'email-marketer',
    name: 'Email Marketer',
    description: 'Email sequences, A/B testing, deliverability optimization.',
    longDescription: 'Designs email marketing campaigns from welcome sequences to re-engagement flows. Writes subject lines optimized for open rates, segments audiences, and analyzes campaign performance.',
    icon: '📧',
    category: 'marketing',
    capabilities: ['Email Sequences', 'Subject Line Testing', 'Audience Segmentation', 'Deliverability', 'Automation Flows'],
    tools: ['web-search', 'file-write', 'email-send'],
    knowledgeSize: '1.5 MB',
    author: 'Community',
    version: '0.9.0',
    installed: false,
    starred: false,
    installCount: 0,
    tags: ['email', 'marketing', 'automation'],
  },
];

const CATEGORY_ICONS: Record<AgentCategory, typeof Brain> = {
  marketing: Megaphone,
  analytics: BarChart3,
  content: PenTool,
  development: Wrench,
  productivity: Users,
};

const CATEGORY_LABELS: Record<AgentCategory, string> = {
  marketing: 'Marketing',
  analytics: 'Analytics',
  content: 'Content',
  development: 'Development',
  productivity: 'Productivity',
};

// ── Component ──────────────────────────────────────────────────────────────

export default function AgentMarketplace({ onCreateFromTemplate }: AgentMarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory | 'all'>('all');
  const [selectedAgent, setSelectedAgent] = useState<MarketplaceAgent | null>(null);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  const filteredAgents = useMemo(() => {
    let agents = MARKETPLACE_AGENTS;

    if (selectedCategory !== 'all') {
      agents = agents.filter((a) => a.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      agents = agents.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.tags.some((t) => t.includes(q)),
      );
    }

    return agents;
  }, [searchQuery, selectedCategory]);

  const toggleStar = (id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categories: Array<AgentCategory | 'all'> = ['all', 'marketing', 'analytics', 'content', 'development', 'productivity'];

  // ── Detail View ────────────────────────────────────────────────────────

  if (selectedAgent) {
    const CategoryIcon = CATEGORY_ICONS[selectedAgent.category];
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button
          onClick={() => setSelectedAgent(null)}
          className="text-xs text-muted hover:text-white mb-4 flex items-center gap-1"
        >
          ← Back to Marketplace
        </button>

        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedAgent.icon}</span>
              <div>
                <h2 className="text-lg font-semibold">{selectedAgent.name}</h2>
                <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                  <CategoryIcon size={12} />
                  <span>{CATEGORY_LABELS[selectedAgent.category]}</span>
                  <span>•</span>
                  <span>v{selectedAgent.version}</span>
                  <span>•</span>
                  <span>by {selectedAgent.author}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleStar(selectedAgent.id)}
              className={`p-2 rounded-lg transition-colors ${
                starredIds.has(selectedAgent.id) ? 'text-yellow-400' : 'text-muted hover:text-white'
              }`}
            >
              <Star size={16} fill={starredIds.has(selectedAgent.id) ? 'currentColor' : 'none'} />
            </button>
          </div>

          <p className="text-sm text-muted mb-6">{selectedAgent.longDescription}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-xs font-medium text-muted mb-2">Capabilities</h3>
              <div className="space-y-1">
                {selectedAgent.capabilities.map((cap) => (
                  <div key={cap} className="flex items-center gap-2 text-sm">
                    <Sparkles size={10} className="text-accent" />
                    {cap}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-muted mb-2">Tools</h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgent.tools.map((tool) => (
                  <span key={tool} className="text-xs bg-white/5 border border-border rounded px-2 py-0.5">
                    {tool}
                  </span>
                ))}
              </div>
              <h3 className="text-xs font-medium text-muted mt-4 mb-1">Knowledge Base</h3>
              <span className="text-sm">{selectedAgent.knowledgeSize}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {selectedAgent.installed ? (
              <button
                onClick={() => onCreateFromTemplate?.(selectedAgent.id)}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                <Copy size={14} />
                Duplicate & Customize
              </button>
            ) : selectedAgent.author === 'Community' ? (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-muted rounded-lg text-sm cursor-not-allowed"
              >
                <Lock size={14} />
                Coming Soon
              </button>
            ) : (
              <button className="flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
                <Download size={14} />
                Install
              </button>
            )}
            <button
              onClick={() => onCreateFromTemplate?.(selectedAgent.id)}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-white/5 transition-colors"
            >
              <Plus size={14} />
              Create from Template
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Grid View ──────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Store size={20} className="text-accent" />
          Agent Marketplace
        </h1>
        <span className="text-xs text-muted">{filteredAgents.length} agents</span>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-accent text-black'
                : 'bg-surface border border-border text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredAgents.map((agent) => {
          const CategoryIcon = CATEGORY_ICONS[agent.category];
          return (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className="text-left bg-surface border border-border rounded-xl p-4 hover:border-accent/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{agent.icon}</span>
                  <div>
                    <h3 className="text-sm font-medium group-hover:text-accent transition-colors">{agent.name}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted">
                      <CategoryIcon size={10} />
                      <span>{CATEGORY_LABELS[agent.category]}</span>
                      {!agent.installed && agent.author === 'Community' && (
                        <>
                          <span>•</span>
                          <span className="text-yellow-500">Coming Soon</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {agent.installed && (
                    <span className="text-[10px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">Installed</span>
                  )}
                  <Star
                    size={12}
                    className={starredIds.has(agent.id) ? 'text-yellow-400' : 'text-muted opacity-0 group-hover:opacity-100'}
                    fill={starredIds.has(agent.id) ? 'currentColor' : 'none'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(agent.id);
                    }}
                  />
                </div>
              </div>

              <p className="text-xs text-muted mb-3 line-clamp-2">{agent.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {agent.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] bg-white/5 border border-border rounded px-1.5 py-0.5 text-muted">
                      {tag}
                    </span>
                  ))}
                </div>
                <ChevronRight size={12} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12 text-muted text-sm">
          No agents match your search. Try a different query.
        </div>
      )}

      {/* Community CTA */}
      <div className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Globe size={14} className="text-accent" />
            Community Marketplace
          </h3>
          <p className="text-xs text-muted mt-1">
            Share your custom agents and discover templates from the community. Coming soon.
          </p>
        </div>
        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-muted cursor-not-allowed"
        >
          <ExternalLink size={12} />
          Explore
        </button>
      </div>
    </div>
  );
}
