import { useState } from 'react';
import {
  Brain, Database, MessageSquare, Zap, Clock, TrendingUp,
  FileText, DollarSign, ChevronRight, ArrowLeft, Star,
} from 'lucide-react';
import type { Agent } from '../../lib/types';

// ---- Types ----

interface AgentProfileData {
  agent: Agent;
  capabilities: Capability[];
  knowledgeBase: { fileCount: number; totalSizeBytes: number; lastUpdated: number };
  memoryStats: { factsLearned: number; conversationCount: number; patternsActive: number };
  usageStats: { messagesSent: number; tokensUsed: number; estimatedCost: number };
  performance: { avgResponseMs: number; qualityScore: number; successRate: number };
  recentConversations: RecentConversation[];
}

interface Capability {
  name: string;
  icon: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
}

interface RecentConversation {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: number;
}

interface Props {
  data: AgentProfileData;
  onBack: () => void;
  onSelectConversation: (id: string) => void;
}

// ---- Stat Card ----

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/5 border border-border">
      <div className="flex items-center gap-2 text-muted mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-lg font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

// ---- Skill Level Bar ----

function SkillLevel({ level }: { level: Capability['level'] }) {
  const levels = { basic: 1, intermediate: 2, advanced: 3, expert: 4 };
  const n = levels[level];
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i <= n ? 'bg-accent' : 'bg-muted/20'}`}
        />
      ))}
    </div>
  );
}

// ---- Main Component ----

export default function AgentProfile({ data, onBack, onSelectConversation }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'knowledge' | 'memory'>('overview');
  const { agent, capabilities, knowledgeBase, memoryStats, usageStats, performance, recentConversations } = data;

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Agent Header */}
      <div className="flex items-start gap-4">
        <div className="text-5xl w-16 h-16 flex items-center justify-center rounded-2xl bg-accent/10">
          {agent.icon}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{agent.name}</h1>
          <p className="text-sm text-muted mt-1">{agent.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              {agent.category}
            </span>
            {performance.qualityScore > 0 && (
              <span className="text-xs flex items-center gap-1 text-yellow-400">
                <Star size={10} fill="currentColor" />
                {performance.qualityScore.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border">
        {(['overview', 'knowledge', 'memory'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm capitalize transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={<MessageSquare size={14} />}
              label="Messages"
              value={usageStats.messagesSent.toLocaleString()}
            />
            <StatCard
              icon={<Zap size={14} />}
              label="Tokens Used"
              value={formatTokens(usageStats.tokensUsed)}
            />
            <StatCard
              icon={<DollarSign size={14} />}
              label="Est. Cost"
              value={`$${usageStats.estimatedCost.toFixed(2)}`}
            />
            <StatCard
              icon={<Clock size={14} />}
              label="Avg Response"
              value={`${(performance.avgResponseMs / 1000).toFixed(1)}s`}
              sub={`${(performance.successRate * 100).toFixed(0)}% success`}
            />
          </div>

          {/* Capabilities */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp size={14} /> Capabilities
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {capabilities.map((cap) => (
                <div
                  key={cap.name}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/5 border border-border"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cap.icon}</span>
                    <span className="text-xs">{cap.name}</span>
                  </div>
                  <SkillLevel level={cap.level} />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MessageSquare size={14} /> Recent Conversations
            </h3>
            <div className="space-y-1">
              {recentConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/5 transition-colors group"
                >
                  <div className="text-left">
                    <div className="text-sm">{conv.title}</div>
                    <div className="text-xs text-muted">
                      {conv.messageCount} messages · {formatTimeAgo(conv.updatedAt)}
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </button>
              ))}
              {recentConversations.length === 0 && (
                <p className="text-xs text-muted py-4 text-center">No conversations yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Tab */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<FileText size={14} />}
              label="Files"
              value={knowledgeBase.fileCount}
            />
            <StatCard
              icon={<Database size={14} />}
              label="Total Size"
              value={formatBytes(knowledgeBase.totalSizeBytes)}
            />
            <StatCard
              icon={<Clock size={14} />}
              label="Last Updated"
              value={formatTimeAgo(knowledgeBase.lastUpdated)}
            />
          </div>
          <p className="text-xs text-muted text-center py-8">
            Knowledge base browser coming in next update
          </p>
        </div>
      )}

      {/* Memory Tab */}
      {activeTab === 'memory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<Brain size={14} />}
              label="Facts Learned"
              value={memoryStats.factsLearned}
            />
            <StatCard
              icon={<MessageSquare size={14} />}
              label="Conversations"
              value={memoryStats.conversationCount}
            />
            <StatCard
              icon={<TrendingUp size={14} />}
              label="Active Patterns"
              value={memoryStats.patternsActive}
            />
          </div>
          <p className="text-xs text-muted text-center py-8">
            Memory inspector integration coming in next update
          </p>
        </div>
      )}
    </div>
  );
}

// ---- Helpers ----

function formatTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
