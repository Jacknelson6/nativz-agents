import { useEffect, useState, useCallback } from "react";
import { useAgentStore } from "../../stores/agentStore";
import { useAppStore } from "../../stores/appStore";
import { useChatStore } from "../../stores/chatStore";
import { listConversations } from "../../lib/tauri";
import {
  Search,
  MessageSquare,
  Wrench,
  BookOpen,
  BarChart3,
  ArrowRight,
  Sparkles,
  Clock,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ConversationTemplates from "../chat/ConversationTemplates";

interface RecentConversation {
  id: string;
  agentId: string;
  title: string;
  updatedAt: string;
}

export default function AgentPicker() {
  const { agents, selectAgent } = useAgentStore();
  const { setView } = useAppStore();
  const { loadConversationMessages } = useChatStore();
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);

  // Auto-select if there's only one agent
  useEffect(() => {
    if (agents.length === 1 && agents[0]) {
      selectAgent(agents[0]);
    }
  }, [agents, selectAgent]);

  // Fetch recent conversations across all agents
  const fetchRecent = useCallback(async () => {
    const allRecent: RecentConversation[] = [];
    for (const agent of agents) {
      try {
        const convs = await listConversations(agent.id);
        for (const c of convs.slice(0, 3)) {
          allRecent.push({
            id: c.id,
            agentId: agent.id,
            title: c.title || "Untitled",
            updatedAt: String(c.updatedAt || ""),
          });
        }
      } catch {
        // skip
      }
    }
    allRecent.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setRecentConversations(allRecent.slice(0, 5));
  }, [agents]);

  useEffect(() => {
    if (agents.length > 0) fetchRecent();
  }, [agents, fetchRecent]);

  const resumeConversation = (conv: RecentConversation) => {
    const agent = agents.find((a) => a.id === conv.agentId);
    if (agent) selectAgent(agent);
    loadConversationMessages(conv.id, conv.agentId);
    setView("chat");
  };

  const startNewChat = (agentId?: string) => {
    const agent = agentId
      ? agents.find((a) => a.id === agentId)
      : agents.find((a) => a.id === "seo") ?? agents[0];
    if (agent) selectAgent(agent);
    setView("chat");
  };

  const handleTemplate = (prompt: string) => {
    const seoAgent = agents.find((a) => a.id === "seo") ?? agents[0];
    if (seoAgent) selectAgent(seoAgent);
    setView("chat");
    localStorage.setItem(`draft:${seoAgent?.id ?? "seo"}`, prompt);
  };

  // Format relative time
  const timeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // Multi-agent dashboard
  if (agents.length > 1) {
    return (
      <div className="flex flex-col h-full px-6 py-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {agents.length} agents ready to help
              </p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => startNewChat()}>
              <Plus size={14} />
              New Chat
            </Button>
          </div>

          {/* Recent Conversations */}
          {recentConversations.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock size={11} />
                Recent Conversations
              </h2>
              <div className="space-y-1.5">
                {recentConversations.map((conv) => {
                  const agent = agents.find((a) => a.id === conv.agentId);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => resumeConversation(conv)}
                      className="w-full text-left px-3.5 py-2.5 rounded-lg border border-border/50 hover:border-primary/20 hover:bg-muted/20 transition-all group flex items-center gap-3"
                    >
                      <span className="text-lg shrink-0">{agent?.icon ?? "🤖"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {conv.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {agent?.name ?? conv.agentId} · {timeAgo(conv.updatedAt)}
                        </p>
                      </div>
                      <ArrowRight size={12} className="text-muted-foreground/30 group-hover:text-primary/60 transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Agent Cards */}
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles size={11} />
              Your Agents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agents.map((agent) => (
                <Card
                  key={agent.id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer transition-all duration-200 hover:border-primary/20 hover:shadow-md group focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onClick={() => startNewChat(agent.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      startNewChat(agent.id);
                    }
                  }}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <span className="text-2xl shrink-0">{agent.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                          {agent.name}
                        </h3>
                        <ArrowRight size={12} className="text-muted-foreground/30 group-hover:text-primary/60 transition-all" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {agent.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Quick Start Templates */}
          <section>
            <ConversationTemplates onSelectTemplate={handleTemplate} />
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: Wrench, label: "SEO Tools", view: "tools" as const },
                { icon: BookOpen, label: "Knowledge Base", view: "knowledge" as const },
                { icon: BarChart3, label: "Analytics", view: "analytics" as const },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setView(action.view)}
                >
                  <action.icon size={13} />
                  {action.label}
                </Button>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Single-agent home (SEO home)
  const startChat = () => startNewChat();

  const navCards = [
    {
      icon: MessageSquare,
      title: "Chat",
      description: "Talk to your SEO agent about anything",
      action: startChat,
      accent: true,
    },
    {
      icon: Wrench,
      title: "SEO Tools",
      description: "Launch specialized SEO workflows",
      action: () => setView("tools"),
    },
    {
      icon: BookOpen,
      title: "Knowledge Base",
      description: "Browse SEO knowledge and docs",
      action: () => setView("knowledge"),
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "View usage stats and costs",
      action: () => setView("analytics"),
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 overflow-y-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-5 shadow-sm">
          <Search size={32} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Nativz SEO</h1>
        <p className="text-sm text-muted-foreground mt-2.5 max-w-md leading-relaxed">
          Your expert SEO consultant. Technical audits, keyword research,
          content strategy, and competitive analysis — all powered by AI.
        </p>
      </div>

      {/* Recent Conversations */}
      {recentConversations.length > 0 && (
        <div className="w-full max-w-lg mb-8">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock size={11} />
            Recent
          </h3>
          <div className="space-y-1.5">
            {recentConversations.slice(0, 3).map((conv) => (
              <button
                key={conv.id}
                onClick={() => resumeConversation(conv)}
                className="w-full text-left px-3.5 py-2.5 rounded-lg border border-border/50 hover:border-primary/20 hover:bg-muted/20 transition-all group flex items-center gap-3"
              >
                <MessageSquare size={14} className="text-muted-foreground shrink-0" />
                <span className="text-sm truncate flex-1 group-hover:text-primary transition-colors">
                  {conv.title}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(conv.updatedAt)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg w-full">
        {navCards.map((card) => (
          <Card
            key={card.title}
            role="button"
            tabIndex={0}
            className={`cursor-pointer transition-all duration-200 group hover:shadow-lg hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
              card.accent
                ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                : "hover:border-primary/20"
            }`}
            onClick={card.action}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.action();
              }
            }}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                  card.accent
                    ? "bg-primary/15"
                    : "bg-muted/50 group-hover:bg-primary/10"
                } transition-colors`}
              >
                <card.icon
                  size={18}
                  className={
                    card.accent
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-primary transition-colors"
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <ArrowRight
                    size={12}
                    className="text-muted-foreground/40 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Start Templates */}
      <div className="mt-8">
        <ConversationTemplates onSelectTemplate={handleTemplate} />
      </div>

      {/* Footer hint */}
      <div className="flex items-center gap-1.5 mt-10 text-[11px] text-muted-foreground/40">
        <Sparkles size={10} />
        <span>6 knowledge files · 8 skill workflows · 17+ tools</span>
      </div>
    </div>
  );
}
