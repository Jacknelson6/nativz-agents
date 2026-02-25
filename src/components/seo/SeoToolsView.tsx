import { useState, useCallback } from "react";
import {
  Search,
  Globe,
  FileText,
  Link,
  MapPin,
  BarChart3,
  Code,
  FileSearch,
  Sparkles,
  ArrowRight,
  Target,
  TrendingUp,
  Shield,
  Zap,
  ListChecks,
} from "lucide-react";
import BulkToolRunner from "./BulkToolRunner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgentStore } from "../../stores/agentStore";
import { useAppStore } from "../../stores/appStore";
import { useChatStore } from "../../stores/chatStore";

// ─── Tool Categories ─────────────────────────────────────────────────────────

interface SeoTool {
  id: string;
  name: string;
  description: string;
  icon: typeof Search;
  category: "audit" | "research" | "content" | "local" | "monitor";
  prompt: string;
  badge?: string;
}

const SEO_TOOLS: SeoTool[] = [
  // Audit tools
  {
    id: "technical-audit",
    name: "Technical SEO Audit",
    description: "Full crawl, indexability, Core Web Vitals, structured data, and site architecture analysis",
    icon: Shield,
    category: "audit",
    prompt: "Run a comprehensive technical SEO audit on {url}. Check robots.txt, sitemap, crawlability, indexability, Core Web Vitals, structured data, mobile-friendliness, and security.",
  },
  {
    id: "page-speed",
    name: "Page Speed Analysis",
    description: "Core Web Vitals and performance audit with fix recommendations",
    icon: Zap,
    category: "audit",
    prompt: "Analyze the page speed and Core Web Vitals for {url}. Check LCP, INP, CLS, and provide specific recommendations to improve performance.",
  },
  {
    id: "schema-validator",
    name: "Schema Markup Check",
    description: "Validate and suggest structured data improvements",
    icon: Code,
    category: "audit",
    prompt: "Check the structured data/schema markup on {url}. Validate existing JSON-LD, identify missing schema opportunities, and generate recommended markup.",
  },
  {
    id: "meta-tag-audit",
    name: "Meta Tag Optimizer",
    description: "Analyze title tags, meta descriptions, and Open Graph tags",
    icon: FileSearch,
    category: "audit",
    prompt: "Analyze all meta tags on {url}. Score the title tag, meta description, and OG tags. Suggest optimized versions for better CTR and rankings.",
  },
  {
    id: "broken-links",
    name: "Broken Link Checker",
    description: "Find internal and external broken links across your site",
    icon: Link,
    category: "audit",
    prompt: "Check {url} for broken links. Crawl the site and identify any internal 404s, external dead links, and redirect chains.",
  },

  // Research tools
  {
    id: "keyword-research",
    name: "Keyword Research",
    description: "Discover keyword opportunities with intent classification and clustering",
    icon: Search,
    category: "research",
    prompt: "Conduct comprehensive keyword research for '{topic}'. Find keyword clusters, classify search intent, identify quick wins, and map keywords to content types.",
    badge: "Popular",
  },
  {
    id: "competitor-analysis",
    name: "Competitor Analysis",
    description: "Analyze competitor SEO strategy, content gaps, and backlink profiles",
    icon: Target,
    category: "research",
    prompt: "Run a full competitive SEO analysis comparing {url} against its top organic competitors. Analyze content strategy, keyword coverage, technical implementation, and backlink profiles.",
  },
  {
    id: "serp-analysis",
    name: "SERP Analysis",
    description: "Analyze search results for a query and identify ranking opportunities",
    icon: BarChart3,
    category: "research",
    prompt: "Analyze the search engine results page for '{topic}'. Identify SERP features, content types that rank, gaps in coverage, and opportunities.",
  },
  {
    id: "backlink-analysis",
    name: "Backlink Analysis",
    description: "Evaluate backlink profile, anchor text distribution, and link quality",
    icon: Link,
    category: "research",
    prompt: "Analyze the backlink profile for {url}. Examine referring domains, anchor text distribution, link quality signals, and compare against competitors.",
  },

  // Content tools
  {
    id: "content-brief",
    name: "Content Brief Generator",
    description: "Generate a detailed writing brief with outline, keywords, and specs",
    icon: FileText,
    category: "content",
    prompt: "Create a comprehensive content brief for the keyword '{topic}'. Include target word count, heading structure, key entities to cover, questions to answer, competing content analysis, and internal linking suggestions.",
    badge: "Popular",
  },
  {
    id: "content-optimizer",
    name: "Content Optimizer",
    description: "Analyze existing content and get optimization recommendations",
    icon: Sparkles,
    category: "content",
    prompt: "Analyze the content on {url} and provide optimization recommendations. Check keyword usage, heading structure, content depth, readability, internal links, and E-E-A-T signals.",
  },
  {
    id: "content-strategy",
    name: "Content Strategy Planner",
    description: "Build a topic cluster architecture and content calendar",
    icon: TrendingUp,
    category: "content",
    prompt: "Develop a content strategy for {url}. Create topic cluster architecture, identify content gaps, prioritize by ROI, and build a quarterly content calendar.",
  },

  // Local tools
  {
    id: "local-audit",
    name: "Local SEO Audit",
    description: "Google Business Profile, citations, and local ranking factors",
    icon: MapPin,
    category: "local",
    prompt: "Run a local SEO audit for '{topic}'. Check Google Business Profile optimization, local citation consistency, location page quality, local schema markup, and review strategy.",
  },

  // Monitor tools
  {
    id: "site-health",
    name: "Site Health Check",
    description: "Quick overall SEO health score with key metrics",
    icon: Globe,
    category: "monitor",
    prompt: "Run a quick site health check on {url}. Score the site across technical SEO, on-page optimization, content quality, and provide the top 5 issues to fix.",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Tools", icon: Sparkles },
  { id: "audit", label: "Audit", icon: Shield },
  { id: "research", label: "Research", icon: Search },
  { id: "content", label: "Content", icon: FileText },
  { id: "local", label: "Local", icon: MapPin },
  { id: "monitor", label: "Monitor", icon: BarChart3 },
] as const;

// ─── Quick Actions ───────────────────────────────────────────────────────────

interface QuickAction {
  label: string;
  icon: typeof Search;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Full Site Audit",
    icon: Shield,
    prompt: "Run a full technical SEO audit on ",
  },
  {
    label: "Find Keywords",
    icon: Search,
    prompt: "Research keywords for ",
  },
  {
    label: "Content Brief",
    icon: FileText,
    prompt: "Create a content brief for the keyword ",
  },
  {
    label: "Check Competitors",
    icon: Target,
    prompt: "Analyze SEO competitors for ",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function SeoToolsView() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [urlInput, setUrlInput] = useState("");
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [showBulkRunner, setShowBulkRunner] = useState(false);
  const { selectAgent } = useAgentStore();
  const { agents } = useAgentStore();
  const { setView } = useAppStore();
  const { sendMessage, setAgent } = useChatStore();

  const filteredTools = selectedCategory === "all"
    ? SEO_TOOLS
    : SEO_TOOLS.filter((t) => t.category === selectedCategory);

  const launchTool = useCallback(
    (tool: SeoTool) => {
      const value = urlInput.trim() || "example.com";
      const prompt = tool.prompt
        .replace("{url}", value)
        .replace("{topic}", value);

      // Select SEO agent and navigate to chat
      const seoAgent = agents.find((a) => a.id === "seo");
      if (seoAgent) selectAgent(seoAgent);
      setAgent("seo");
      sendMessage("seo", prompt);
      setView("chat");
    },
    [urlInput, agents, selectAgent, setAgent, sendMessage, setView]
  );

  const launchQuickAction = useCallback(
    (action: QuickAction) => {
      const value = urlInput.trim();
      if (!value) return;
      const seoAgent = agents.find((a) => a.id === "seo");
      if (seoAgent) selectAgent(seoAgent);
      setAgent("seo");
      sendMessage("seo", action.prompt + value);
      setView("chat");
    },
    [urlInput, agents, selectAgent, setAgent, sendMessage, setView]
  );

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden overscroll-contain">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2.5">
            <h1 className="text-2xl font-bold tracking-tight">SEO Tools</h1>
            <p className="text-sm text-muted-foreground/80 max-w-2xl leading-relaxed">
              Launch any tool below with a URL or topic. Each tool triggers a specialized workflow with your SEO agent.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs shrink-0"
            onClick={() => setShowBulkRunner(true)}
          >
            <ListChecks size={14} />
            Bulk Run
          </Button>
        </div>

        {/* URL Input + Quick Actions */}
        <Card className="border-primary/20 bg-card/50">
          <CardContent className="p-5 space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Enter a URL or topic (e.g., example.com or 'organic coffee')"
                  className="pl-10 h-11 text-sm"
                  aria-label="URL or topic input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && urlInput.trim()) {
                      launchTool(SEO_TOOLS[0]);
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => launchQuickAction(action)}
                  disabled={!urlInput.trim()}
                >
                  <action.icon size={12} />
                  {action.label}
                  <ArrowRight size={10} className="ml-0.5 opacity-50" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="h-9 bg-muted/50 w-full overflow-x-auto justify-start sm:justify-center">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="gap-1.5 text-xs data-[state=active]:bg-background"
              >
                <Icon size={12} />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  isActive={activeToolId === tool.id}
                  onLaunch={() => launchTool(tool)}
                  onHover={() => setActiveToolId(tool.id)}
                  onLeave={() => setActiveToolId(null)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatMini icon={Shield} label="Tools Available" value={String(SEO_TOOLS.length)} />
          <StatMini icon={FileText} label="Skill Workflows" value="8" />
          <StatMini icon={Globe} label="Knowledge Files" value="6" />
          <StatMini icon={Sparkles} label="AI Models" value="5" />
        </div>
      </div>

      {showBulkRunner && (
        <BulkToolRunner
          onRunUrl={(tool, url) => {
            // Send to chat as a prompt
            // For now just log - actual integration would need chat store
            console.log(`[BulkRun] ${tool} -> ${url}`);
          }}
          onClose={() => setShowBulkRunner(false)}
        />
      )}
    </div>
  );
}

// ─── Sub Components ──────────────────────────────────────────────────────────

function ToolCard({
  tool,
  isActive,
  onLaunch,
  onHover,
  onLeave,
}: {
  tool: SeoTool;
  isActive: boolean;
  onLaunch: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  const Icon = tool.icon;

  return (
    <Card
      className={`group cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 ${
        isActive ? "border-primary/30 shadow-lg shadow-primary/5" : ""
      }`}
      onClick={onLaunch}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onLaunch(); }}}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
            <Icon size={18} className="text-primary" />
          </div>
          {tool.badge && (
            <Badge variant="secondary" className="text-[10px] h-5">
              {tool.badge}
            </Badge>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
            {tool.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
            {tool.description}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground/60 group-hover:text-primary/60 transition-colors">
          <span>Launch</span>
          <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatMini({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Search;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/30 px-4 py-3.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/30">
        <Icon size={14} className="text-muted-foreground/70" />
      </div>
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
