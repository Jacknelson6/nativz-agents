import { useState, useCallback, type ReactNode } from 'react';
import {
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronDown,
  Table,
  Code,
  Braces,
  FileText,
  Calendar,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ArtifactType = 'table' | 'code' | 'json' | 'report' | 'calendar';

interface DetectedArtifact {
  type: ArtifactType;
  content: string;
  language?: string;
  title?: string;
}

// ─── Detection ───────────────────────────────────────────────────────────────

function detectArtifacts(text: string): DetectedArtifact[] {
  const artifacts: DetectedArtifact[] = [];

  // Code blocks with optional language
  const codeBlockRe = /```(\w*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = codeBlockRe.exec(text)) !== null) {
    const lang = match[1] || 'text';
    const code = match[2].trim();

    // Check if it's JSON
    if (lang === 'json' || (lang === '' && code.startsWith('{'))) {
      try {
        JSON.parse(code);
        artifacts.push({ type: 'json', content: code, title: 'JSON Data' });
        continue;
      } catch {
        // not valid JSON, treat as code
      }
    }

    artifacts.push({ type: 'code', content: code, language: lang, title: `${lang.toUpperCase()} Code` });
  }

  // Markdown tables (| ... | pattern)
  const tableRe = /(?:^|\n)(\|[^\n]+\|\n\|[\s:|-]+\|\n(?:\|[^\n]+\|\n?)+)/g;
  while ((match = tableRe.exec(text)) !== null) {
    artifacts.push({ type: 'table', content: match[1].trim(), title: 'Table' });
  }

  // Standalone JSON objects (not in code blocks)
  const jsonRe = /(?:^|\n)(\{[\s\S]{20,}?\n\})/g;
  while ((match = jsonRe.exec(text)) !== null) {
    const candidate = match[1].trim();
    // Skip if already captured inside a code fence
    const startIdx = match.index;
    const beforeText = text.slice(0, startIdx);
    const openFences = (beforeText.match(/```/g) ?? []).length;
    if (openFences % 2 === 1) continue;
    try {
      JSON.parse(candidate);
      artifacts.push({ type: 'json', content: candidate, title: 'JSON Data' });
    } catch {
      // ignore
    }
  }

  return artifacts;
}

// ─── Syntax Highlighting (regex-based, no heavy lib) ─────────────────────────

const TOKEN_CLASSES: Record<string, RegExp> = {
  'text-purple-400': /\b(const|let|var|function|return|if|else|for|while|import|export|from|class|interface|type|async|await|new|throw|try|catch|default|switch|case|break)\b/g,
  'text-emerald-400': /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g,
  'text-amber-400': /\b(\d+\.?\d*)\b/g,
  'text-sky-400': /\b(true|false|null|undefined|NaN|Infinity)\b/g,
  'text-muted-foreground': /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g,
};

function highlightCode(code: string): string {
  let result = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  for (const [className, regex] of Object.entries(TOKEN_CLASSES)) {
    result = result.replace(regex, `<span class="${className}">$&</span>`);
  }
  return result;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
      title="Copy"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function DownloadButton({ content, filename }: { content: string; filename: string }) {
  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, filename]);

  return (
    <button
      onClick={handleDownload}
      className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
      title={`Download as ${filename}`}
    >
      <Download size={14} />
    </button>
  );
}

function ArtifactShell({
  icon,
  title,
  content,
  filename,
  children,
}: {
  icon: ReactNode;
  title: string;
  content: string;
  filename: string;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`my-3 rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden transition-all ${
        expanded ? 'fixed inset-4 z-50 m-0 rounded-2xl' : ''
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-white/[0.02]">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-medium text-foreground/80 flex-1">{title}</span>
        <CopyButton text={content} />
        <DownloadButton content={content} filename={filename} />
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
      <div className={`overflow-auto ${expanded ? 'h-[calc(100%-40px)]' : 'max-h-[500px]'}`}>
        {children}
      </div>
      {expanded && (
        <div className="fixed inset-0 -z-10 bg-background/70" onClick={() => setExpanded(false)} />
      )}
    </div>
  );
}

// ─── Table Renderer ──────────────────────────────────────────────────────────

function parseMarkdownTable(md: string): { headers: string[]; rows: string[][] } {
  const lines = md.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] =>
    line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && !/^[-:]+$/.test(c));

  const headers = parseLine(lines[0]);
  const rows = lines.slice(2).map(parseLine);

  return { headers, rows };
}

function TableView({ content }: { content: string }) {
  const { headers, rows } = parseMarkdownTable(content);

  // CSV export
  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return (
    <ArtifactShell
      icon={<Table size={14} />}
      title="Table"
      content={csvContent}
      filename="table.csv"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider bg-white/[0.02]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className="border-b border-border/50 hover:bg-muted/20 transition-colors"
              >
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2 text-foreground/80">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ArtifactShell>
  );
}

// ─── Code Renderer ───────────────────────────────────────────────────────────

function CodeView({ content, language }: { content: string; language: string }) {
  return (
    <ArtifactShell
      icon={<Code size={14} />}
      title={language.toUpperCase()}
      content={content}
      filename={`code.${language || 'txt'}`}
    >
      <pre className="p-4 text-sm leading-relaxed font-mono overflow-x-auto">
        <code dangerouslySetInnerHTML={{ __html: highlightCode(content) }} />
      </pre>
    </ArtifactShell>
  );
}

// ─── JSON Tree View ──────────────────────────────────────────────────────────

function JsonNode({ name, value, depth }: { name?: string; value: unknown; depth: number }) {
  const [open, setOpen] = useState(depth < 2);

  if (value === null || value === undefined) {
    return (
      <div className="flex items-center gap-1" style={{ paddingLeft: depth * 16 }}>
        {name && <span className="text-purple-400">{name}: </span>}
        <span className="text-muted-foreground">null</span>
      </div>
    );
  }

  if (typeof value === 'string') {
    return (
      <div className="flex items-start gap-1" style={{ paddingLeft: depth * 16 }}>
        {name && <span className="text-purple-400 shrink-0">{name}: </span>}
        <span className="text-emerald-400 break-all">&quot;{value}&quot;</span>
      </div>
    );
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return (
      <div className="flex items-center gap-1" style={{ paddingLeft: depth * 16 }}>
        {name && <span className="text-purple-400">{name}: </span>}
        <span className="text-amber-400">{String(value)}</span>
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 hover:bg-muted/30 rounded w-full text-left"
          style={{ paddingLeft: depth * 16 }}
        >
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {name && <span className="text-purple-400">{name}: </span>}
          <span className="text-muted-foreground">[{value.length}]</span>
        </button>
        {open && value.map((item, i) => <JsonNode key={i} name={String(i)} value={item} depth={depth + 1} />)}
      </div>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 hover:bg-muted/30 rounded w-full text-left"
          style={{ paddingLeft: depth * 16 }}
        >
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {name && <span className="text-purple-400">{name}: </span>}
          <span className="text-muted-foreground">{`{${entries.length}}`}</span>
        </button>
        {open && entries.map(([k, v]) => <JsonNode key={k} name={k} value={v} depth={depth + 1} />)}
      </div>
    );
  }

  return null;
}

function JsonView({ content }: { content: string }) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return <CodeView content={content} language="json" />;
  }

  return (
    <ArtifactShell
      icon={<Braces size={14} />}
      title="JSON"
      content={JSON.stringify(parsed, null, 2)}
      filename="data.json"
    >
      <div className="p-4 text-sm font-mono leading-relaxed">
        <JsonNode value={parsed} depth={0} />
      </div>
    </ArtifactShell>
  );
}

// ─── Report / Calendar Renderers ─────────────────────────────────────────────

function ReportView({ content }: { content: string }) {
  return (
    <ArtifactShell
      icon={<FileText size={14} />}
      title="Report"
      content={content}
      filename="report.md"
    >
      <div className="p-4 prose prose-invert prose-sm max-w-none">
        <pre className="whitespace-pre-wrap text-sm text-foreground/80 font-sans leading-relaxed">
          {content}
        </pre>
      </div>
    </ArtifactShell>
  );
}

function CalendarView({ content }: { content: string }) {
  return (
    <ArtifactShell
      icon={<Calendar size={14} />}
      title="Calendar"
      content={content}
      filename="calendar.md"
    >
      <div className="p-4 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans">
        {content}
      </div>
    </ArtifactShell>
  );
}

// ─── Artifact type icon ──────────────────────────────────────────────────────

function artifactView(artifact: DetectedArtifact): ReactNode {
  switch (artifact.type) {
    case 'table':
      return <TableView content={artifact.content} />;
    case 'code':
      return <CodeView content={artifact.content} language={artifact.language ?? 'text'} />;
    case 'json':
      return <JsonView content={artifact.content} />;
    case 'report':
      return <ReportView content={artifact.content} />;
    case 'calendar':
      return <CalendarView content={artifact.content} />;
  }
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function ArtifactRenderer({ text }: { text: string }) {
  const artifacts = detectArtifacts(text);

  if (artifacts.length === 0) return null;

  return (
    <div className="space-y-2">
      {artifacts.map((artifact, i) => (
        <div key={i}>{artifactView(artifact)}</div>
      ))}
    </div>
  );
}

export { detectArtifacts, type DetectedArtifact, type ArtifactType };
