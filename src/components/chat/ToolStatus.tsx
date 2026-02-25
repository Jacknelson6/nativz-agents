import { useState, useEffect, useRef, type ReactNode } from "react";
import type { ToolCall } from "../../lib/types";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Wrench,
  Globe,
  Network,
  HardDrive,
  Brain,
} from "lucide-react";

function getToolIcon(name: string): ReactNode {
  if (name.startsWith("web-search")) return <Globe size={12} className="text-sky-400" />;
  if (name.startsWith("web-crawl")) return <Network size={12} className="text-amber-400" />;
  if (name.startsWith("http-request")) return <Globe size={12} className="text-emerald-400" />;
  if (name.startsWith("browse") || name.startsWith("browser")) return <Globe size={12} className="text-purple-400" />;
  if (name.startsWith("memory")) return <Brain size={12} className="text-pink-400" />;
  if (name.startsWith("file")) return <HardDrive size={12} className="text-muted-foreground" />;
  return <Wrench size={12} className="text-muted-foreground" />;
}

function formatOutput(name: string, output: string): ReactNode {
  try {
    const data = JSON.parse(output);

    // web-search: show results list
    if (name === "web-search" && data.results) {
      return (
        <div className="space-y-2">
          {data.results.map((r: { title: string; url: string; description: string }, i: number) => (
            <div key={i} className="text-xs">
              <div className="font-medium text-foreground">{r.title}</div>
              <div className="text-muted-foreground/60 truncate">{r.url}</div>
              <div className="text-muted-foreground mt-0.5">{r.description}</div>
            </div>
          ))}
        </div>
      );
    }

    // http-request: show status code + headers
    if (name === "http-request" && data.status) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-mono font-bold ${data.status < 400 ? "text-emerald-400" : "text-red-400"}`}>
              {data.status}
            </span>
            {data.statusText && <span className="text-muted-foreground">{data.statusText}</span>}
          </div>
          {data.headers && (
            <pre className="text-xs text-muted-foreground overflow-x-auto max-h-24">
              {typeof data.headers === "string" ? data.headers : JSON.stringify(data.headers, null, 2)}
            </pre>
          )}
          {data.body && (
            <pre className="text-xs text-muted-foreground overflow-x-auto max-h-32 mt-1">
              {typeof data.body === "string" ? data.body.slice(0, 500) : JSON.stringify(data.body, null, 2).slice(0, 500)}
              {(typeof data.body === "string" ? data.body.length : JSON.stringify(data.body).length) > 500 ? "..." : ""}
            </pre>
          )}
        </div>
      );
    }

    // memory skills: show key/value
    if (name.startsWith("memory-") && (data.key || data.entries)) {
      if (data.entries) {
        const entries = Object.entries(data.entries);
        if (entries.length === 0) return <span className="text-xs text-muted-foreground/60">Empty</span>;
        return (
          <div className="space-y-1">
            {entries.map(([k, v]) => (
              <div key={k} className="text-xs flex gap-2">
                <span className="font-mono text-pink-400">{k}</span>
                <span className="text-muted-foreground">{String(v)}</span>
              </div>
            ))}
          </div>
        );
      }
      return (
        <div className="text-xs">
          <span className="font-mono text-pink-400">{data.key}</span>
          {data.value && <span className="text-muted-foreground ml-2">{data.value}</span>}
          {data.success !== undefined && (
            <span className={`ml-2 ${data.success ? "text-emerald-400" : "text-red-400"}`}>
              {data.success ? "saved" : data.error || "failed"}
            </span>
          )}
        </div>
      );
    }

    // Error response
    if (data.error) {
      return <span className="text-xs text-red-400">{data.error}</span>;
    }

    // Generic JSON
    return (
      <pre className="text-xs text-muted-foreground overflow-x-auto max-h-40">
        {JSON.stringify(data, null, 2).slice(0, 1000)}
        {JSON.stringify(data).length > 1000 ? "..." : ""}
      </pre>
    );
  } catch {
    // Plain text output
    return (
      <pre className="text-xs text-muted-foreground overflow-x-auto max-h-40 whitespace-pre-wrap">
        {output.slice(0, 1000)}
        {output.length > 1000 ? "..." : ""}
      </pre>
    );
  }
}

function toolDisplayName(name: string, input?: Record<string, unknown>): string {
  const base = name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  // Show URL/target for relevant tools
  if (input) {
    const url = (input.url ?? input.target ?? input.query) as string | undefined;
    if (url && typeof url === "string") {
      try {
        const u = new URL(url);
        return `${base} \u2192 ${u.hostname}${u.pathname === "/" ? "" : u.pathname}`;
      } catch {
        // Not a URL — show truncated value (e.g. search query)
        const short = url.length > 50 ? url.slice(0, 47) + "..." : url;
        return `${base} \u2192 ${short}`;
      }
    }
  }
  return base;
}

export default function ToolStatus({ tool, autoExpand = false }: { tool: ToolCall; autoExpand?: boolean }) {
  const hasOutput = tool.output && tool.output.length > 0;
  const hasError = tool.status === "error";
  const [expanded, setExpanded] = useState(autoExpand && (hasOutput || hasError));

  // Elapsed timer for running tools
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (tool.status === "running") {
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tool.status]);

  const statusBadge: Record<string, ReactNode> = {
    running: (
      <span className="flex items-center gap-1 text-[10px] text-amber-400">
        <Loader2 size={10} className="animate-spin" />
        Running
        {elapsed > 0 && (
          <span className="text-muted-foreground/60 font-mono ml-0.5">{elapsed}s</span>
        )}
      </span>
    ),
    completed: (
      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
        <CheckCircle2 size={10} />
        Done
      </span>
    ),
    error: (
      <span className="flex items-center gap-1 text-[10px] text-red-400">
        <XCircle size={10} />
        Error
      </span>
    ),
  };

  return (
    <div className={`my-1.5 rounded-lg border overflow-hidden transition-colors ${
      hasError ? "border-red-400/20 bg-red-400/5" : "border-border bg-card/50"
    }`}>
      <button
        onClick={() => (hasOutput || hasError) && setExpanded(!expanded)}
        className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-left ${
          hasOutput || hasError ? "hover:bg-muted/30 cursor-pointer" : "cursor-default"
        } transition-colors`}
      >
        {(hasOutput || hasError) && (
          expanded
            ? <ChevronDown size={12} className="text-muted-foreground/60 shrink-0" />
            : <ChevronRight size={12} className="text-muted-foreground/60 shrink-0" />
        )}
        {getToolIcon(tool.name)}
        <span className="text-xs font-medium text-foreground/80 flex-1 truncate">
          {toolDisplayName(tool.name, tool.input)}
        </span>
        {statusBadge[tool.status]}
      </button>
      {expanded && hasOutput && (
        <div className="px-3 pb-3 border-t border-border/30">
          <div className="mt-2.5">{formatOutput(tool.name, tool.output!)}</div>
        </div>
      )}
    </div>
  );
}
