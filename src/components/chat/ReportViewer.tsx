import { useState } from 'react';
import { FileText, ChevronDown, ChevronRight, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  filename: string;
  content: string;
}

export default function ReportViewer({ filename, content }: Props) {
  const [expanded, setExpanded] = useState(false);

  const preview = content.split('\n').slice(0, 3).join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-2 bg-card border border-border/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        <FileText size={14} className="text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{filename}</span>
          {!expanded && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{preview}</p>
          )}
        </div>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {expanded && (
        <div className="border-t border-border/50">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-muted/10">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs gap-1.5">
              <Copy size={11} />
              Copy
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 text-xs gap-1.5">
              <Download size={11} />
              Download
            </Button>
          </div>
          <div className="px-4 py-3 max-h-96 overflow-y-auto">
            <pre className="text-xs whitespace-pre-wrap font-mono text-foreground/80 leading-relaxed">{content}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
