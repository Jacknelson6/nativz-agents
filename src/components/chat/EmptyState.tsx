import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Search,
  FileText,
  Shield,
  Target,
  Globe,
  MapPin,
  TrendingUp,
  Layout,
  Link,
  FileSearch,
  BarChart3,
  Lightbulb,
} from "lucide-react";

interface Props {
  onSelectPrompt: (prompt: string) => void;
}

const allSuggestions = [
  { icon: Shield, title: "Technical Audit", prompt: "Run a comprehensive technical SEO audit on example.com", color: "text-emerald-400" },
  { icon: Search, title: "Keyword Research", prompt: "Research keywords for 'organic coffee beans'", color: "text-sky-400" },
  { icon: Target, title: "Competitor Analysis", prompt: "Analyze the SEO strategy of my top 3 competitors", color: "text-amber-400" },
  { icon: FileText, title: "Content Optimization", prompt: "Help me optimize a pricing page for search engines", color: "text-purple-400" },
  { icon: Globe, title: "Backlink Analysis", prompt: "Analyze the backlink profile of example.com", color: "text-rose-400" },
  { icon: MapPin, title: "Local SEO Audit", prompt: "Help me optimize my Google Business Profile for local search", color: "text-teal-400" },
  { icon: TrendingUp, title: "Rank Tracker", prompt: "What keywords is my site currently ranking for?", color: "text-indigo-400" },
  { icon: Layout, title: "Page Speed", prompt: "Analyze the Core Web Vitals for my homepage", color: "text-orange-400" },
  { icon: Link, title: "Internal Linking", prompt: "Create an internal linking strategy for my blog", color: "text-cyan-400" },
  { icon: FileSearch, title: "Content Brief", prompt: "Create a detailed SEO content brief for 'best running shoes 2026'", color: "text-lime-400" },
  { icon: BarChart3, title: "Traffic Analysis", prompt: "Help me understand why my organic traffic dropped this month", color: "text-pink-400" },
  { icon: Lightbulb, title: "Content Ideas", prompt: "Generate 10 SEO-friendly blog post ideas for a SaaS company", color: "text-yellow-400" },
];

export default function EmptyState({ onSelectPrompt }: Props) {
  const [displayedSuggestions] = useState(() => {
    const seed = Math.floor(Date.now() / (1000 * 60 * 60)); // changes hourly
    const shuffled = [...allSuggestions].sort((a, b) => {
      const hashA = (seed * 31 + a.title.charCodeAt(0)) % 100;
      const hashB = (seed * 31 + b.title.charCodeAt(0)) % 100;
      return hashA - hashB;
    });
    return shuffled.slice(0, 4);
  });

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <div className="text-center mb-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-5">
          <Search size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">How can I help?</h2>
        <p className="text-sm text-muted-foreground mt-2.5 max-w-md leading-relaxed">
          Your expert SEO consultant. Ask about technical audits, keyword research, content strategy, or competitive analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
        {displayedSuggestions.map(({ icon: Icon, title, prompt, color }) => (
          <Card
            key={prompt}
            role="button"
            tabIndex={0}
            className="cursor-pointer transition-all duration-200 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 group focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={() => onSelectPrompt(prompt)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectPrompt(prompt); }}}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors shrink-0 mt-0.5">
                <Icon size={15} className={`${color} group-hover:text-primary transition-colors`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold group-hover:text-primary transition-colors">{title}</h3>
                  <ArrowRight
                    size={11}
                    className="text-muted-foreground/30 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all shrink-0"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                  {prompt}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
