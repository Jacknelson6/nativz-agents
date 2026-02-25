import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  agentId?: string;
  onSend: (content: string) => void;
  disabled?: boolean;
}

const SLASH_COMMANDS = [
  { trigger: "/technical-audit", label: "Technical Audit", prompt: "Run a full technical SEO audit on " },
  { trigger: "/keywords", label: "Keyword Research", prompt: "Research keywords for " },
  { trigger: "/on-page", label: "On-Page Optimization", prompt: "Optimize this page for search: " },
  { trigger: "/brief", label: "Content Brief", prompt: "Create a detailed SEO content brief for " },
  { trigger: "/competitors", label: "Competitor Analysis", prompt: "Analyze SEO competitors for " },
  { trigger: "/local", label: "Local SEO Audit", prompt: "Run a local SEO audit for " },
  { trigger: "/backlinks", label: "Backlink Analysis", prompt: "Analyze the backlink profile of " },
  { trigger: "/strategy", label: "Content Strategy", prompt: "Develop an SEO content strategy for " },
];

export default function InputBar({ onSend, disabled, agentId, className }: Props & { className?: string }) {
  const [input, setInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState(SLASH_COMMANDS);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load draft
  useEffect(() => {
    if (agentId) {
      const draft = localStorage.getItem(`draft:${agentId}`);
      if (draft) {
        setInput(draft);
        // Adjust height after mount
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
          }
        }, 0);
      }
    }
  }, [agentId]);

  // Save draft
  useEffect(() => {
    if (agentId && input !== undefined) {
      const timeout = setTimeout(() => {
        if (input.trim()) {
          localStorage.setItem(`draft:${agentId}`, input);
        } else {
          localStorage.removeItem(`draft:${agentId}`);
        }
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [input, agentId]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    if (agentId) localStorage.removeItem(`draft:${agentId}`);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setShowCommands(false);
  }, [input, disabled, onSend, agentId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (showCommands && filteredCommands.length > 0) {
        e.preventDefault();
        applyCommand(filteredCommands[0]);
        return;
      }
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setShowCommands(false);
    }
  };

  const applyCommand = (cmd: typeof SLASH_COMMANDS[0]) => {
    setInput(cmd.prompt);
    setShowCommands(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.startsWith("/")) {
      const query = val.slice(1).toLowerCase();
      const filtered = SLASH_COMMANDS.filter(c => 
        c.trigger.toLowerCase().includes(val.toLowerCase()) ||
        c.label.toLowerCase().includes(query)
      );
      setFilteredCommands(filtered);
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }

    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  return (
    <div className={`border-t p-4 relative ${className}`}>
      {showCommands && filteredCommands.length > 0 && (
        <Card className="absolute bottom-full left-4 right-4 mb-2 z-50 overflow-hidden border-primary/20 shadow-xl max-w-4xl mx-auto">
          <div className="bg-muted/50 px-3 py-1.5 border-b border-border/50 flex items-center gap-2">
            <Sparkles size={12} className="text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SEO Commands</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredCommands.map((cmd, idx) => (
              <button
                key={cmd.trigger}
                onClick={() => applyCommand(cmd)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-primary/10 transition-colors ${idx === 0 ? 'bg-primary/5' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-primary text-xs">{cmd.trigger}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{cmd.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground/50 font-mono">Enter</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card className="max-w-4xl mx-auto flex items-end gap-2 p-2 focus-within:ring-1 focus-within:ring-primary/20 border-border relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Send a message... (Type / for commands)"
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground min-h-[36px] max-h-[200px] py-2 px-2"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="h-8 w-8 shrink-0 rounded-lg"
        >
          <ArrowUp size={16} />
        </Button>
      </Card>
    </div>
  );
}
