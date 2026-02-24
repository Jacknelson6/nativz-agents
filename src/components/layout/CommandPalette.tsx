import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search,
  Bot,
  Settings,
  Brain,
  BookOpen,
  Plus,
  ArrowRight,
  Command,
  Zap,
} from 'lucide-react';
import { useAgentStore } from '../../stores/agentStore';
import { useAppStore } from '../../stores/appStore';

// ─── Types ───────────────────────────────────────────────────────────────────

type ActionCategory = 'action' | 'agent' | 'conversation' | 'memory' | 'settings';

interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  category: ActionCategory;
  icon: typeof Search;
  keywords: string[];
  action: () => void;
}

// ─── Fuzzy search ────────────────────────────────────────────────────────────

function fuzzyMatch(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  if (t.includes(q)) return 2;

  let qi = 0;
  let score = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 1;
      qi++;
    }
  }
  return qi === q.length ? score / q.length : 0;
}

function searchItems(items: PaletteItem[], query: string): PaletteItem[] {
  if (!query.trim()) return items.slice(0, 10);

  return items
    .map((item) => {
      const labelScore = fuzzyMatch(query, item.label) * 3;
      const descScore = fuzzyMatch(query, item.description ?? '') * 1.5;
      const keywordScore = Math.max(0, ...item.keywords.map((k) => fuzzyMatch(query, k) * 2));
      return { item, score: labelScore + descScore + keywordScore };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((r) => r.item);
}

// ─── Category labels & icons ─────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  action: 'Quick Actions',
  agent: 'Agents',
  conversation: 'Conversations',
  memory: 'Memory',
  settings: 'Settings',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { agents, selectAgent } = useAgentStore();
  const { setView, toggleSettings } = useAppStore();

  // Build items list
  const items: PaletteItem[] = useMemo(() => {
    const result: PaletteItem[] = [
      // Quick actions
      {
        id: 'new-chat',
        label: 'New Chat',
        description: 'Start a new conversation',
        category: 'action',
        icon: Plus,
        keywords: ['new', 'chat', 'conversation', 'create'],
        action: () => {
          setView('chat');
          setOpen(false);
        },
      },
      {
        id: 'open-settings',
        label: 'Open Settings',
        description: 'Configure providers, models, and preferences',
        category: 'action',
        icon: Settings,
        keywords: ['settings', 'preferences', 'config', 'api', 'key'],
        action: () => {
          toggleSettings();
          setOpen(false);
        },
      },
      {
        id: 'view-analytics',
        label: 'View Analytics',
        description: 'Usage stats and cost tracking',
        category: 'action',
        icon: Zap,
        keywords: ['analytics', 'usage', 'cost', 'tokens', 'stats'],
        action: () => {
          setView('analytics');
          setOpen(false);
        },
      },
      {
        id: 'go-home',
        label: 'Go Home',
        description: 'Return to agent picker',
        category: 'action',
        icon: ArrowRight,
        keywords: ['home', 'agents', 'back', 'picker'],
        action: () => {
          setView('home');
          setOpen(false);
        },
      },
      {
        id: 'browse-knowledge-view',
        label: 'Knowledge Browser',
        description: 'Browse and manage knowledge base documents',
        category: 'action',
        icon: BookOpen,
        keywords: ['knowledge', 'documents', 'browse', 'files', 'rag'],
        action: () => {
          setView('knowledge');
          setOpen(false);
        },
      },
    ];

    // Agents
    for (const agent of agents) {
      result.push({
        id: `agent-${agent.id}`,
        label: `${agent.icon} ${agent.name}`,
        description: agent.description,
        category: 'agent',
        icon: Bot,
        keywords: [agent.name, agent.category, 'agent', 'switch'],
        action: () => {
          selectAgent(agent);
          setView('chat');
          setOpen(false);
        },
      });
    }

    // Placeholder items for memory & knowledge
    result.push({
      id: 'search-memory',
      label: 'Search Memory',
      description: 'Search across agent memories',
      category: 'memory',
      icon: Brain,
      keywords: ['memory', 'remember', 'search', 'recall'],
      action: () => setOpen(false),
    });

    result.push({
      id: 'browse-knowledge',
      label: 'Browse Knowledge Base',
      description: 'View uploaded documents and knowledge',
      category: 'memory',
      icon: BookOpen,
      keywords: ['knowledge', 'documents', 'files', 'browse'],
      action: () => setOpen(false),
    });

    return result;
  }, [agents, selectAgent, setView, toggleSettings]);

  const results = useMemo(() => searchItems(items, query), [items, query]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = results[selectedIndex];
        if (item) item.action();
      }
    },
    [results, selectedIndex]
  );

  // Group results by category
  const grouped = useMemo(() => {
    const map = new Map<ActionCategory, PaletteItem[]>();
    for (const item of results) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [results]);

  if (!open) return null;

  // Build flat index for keyboard nav
  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Palette */}
      <div className="relative w-full max-w-xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <Search size={18} className="text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search actions, agents, settings..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-zinc-500"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-zinc-400">
            <Command size={10} />K
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
          {results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              No results for &quot;{query}&quot;
            </div>
          )}

          {Array.from(grouped.entries()).map(([category, categoryItems]) => (
            <div key={category}>
              <div className="px-4 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {CATEGORY_LABELS[category]}
                </span>
              </div>
              {categoryItems.map((item) => {
                const idx = flatIndex++;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      idx === selectedIndex
                        ? 'bg-accent/10 text-white'
                        : 'text-zinc-300 hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon
                      size={16}
                      className={idx === selectedIndex ? 'text-accent' : 'text-zinc-500'}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-zinc-500 truncate">{item.description}</p>
                      )}
                    </div>
                    {idx === selectedIndex && (
                      <span className="text-[10px] text-zinc-500">↵</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/5 text-[10px] text-zinc-500">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
