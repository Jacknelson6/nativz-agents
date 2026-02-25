import { Globe, Search, Users, Calendar, MapPin, FileEdit } from 'lucide-react';

interface Template {
  icon: React.ElementType;
  title: string;
  description: string;
  prompt: string;
  color: string;
}

const templates: Template[] = [
  {
    icon: Globe,
    title: 'Audit My Website',
    description: 'Full technical SEO audit',
    prompt: "I'd like a comprehensive technical SEO audit. My website URL is: ",
    color: 'text-emerald-400',
  },
  {
    icon: Search,
    title: 'Keyword Research Sprint',
    description: 'Find target keywords for your niche',
    prompt: "Let's do keyword research for my business. My niche/topic is: ",
    color: 'text-sky-400',
  },
  {
    icon: Users,
    title: 'Competitor Teardown',
    description: 'Analyze competitor SEO strategies',
    prompt: "I want to analyze my competitors' SEO. My site is: ",
    color: 'text-amber-400',
  },
  {
    icon: Calendar,
    title: 'Content Calendar',
    description: 'Plan your content strategy',
    prompt: "Help me create a content calendar. My business goals are: ",
    color: 'text-purple-400',
  },
  {
    icon: MapPin,
    title: 'Local SEO Setup',
    description: 'Optimize for local search',
    prompt: "Help me set up local SEO. My business name is: ",
    color: 'text-rose-400',
  },
  {
    icon: FileEdit,
    title: 'Page Optimizer',
    description: 'Optimize a specific page',
    prompt: "Help me optimize this page for a target keyword. The URL is: ",
    color: 'text-teal-400',
  },
];

interface Props {
  onSelectTemplate: (prompt: string) => void;
}

export default function ConversationTemplates({ onSelectTemplate }: Props) {
  return (
    <div className="w-full max-w-lg">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Start</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {templates.map((t) => (
          <button
            key={t.title}
            onClick={() => onSelectTemplate(t.prompt)}
            className="text-left p-3 rounded-xl border border-border/50 hover:border-primary/20 hover:bg-muted/20 transition-all group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <t.icon size={13} className={t.color} />
              <span className="text-xs font-medium group-hover:text-primary transition-colors">{t.title}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
