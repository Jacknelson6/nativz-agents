import { useState } from 'react';
import { Play, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onRunUrl: (tool: string, url: string) => void;
  onClose: () => void;
}

const BULK_TOOLS = [
  { id: 'technical-audit', label: 'Technical Audit' },
  { id: 'page-speed', label: 'Page Speed Analysis' },
  { id: 'on-page-seo', label: 'On-Page SEO Check' },
  { id: 'backlink-check', label: 'Backlink Analysis' },
  { id: 'content-analysis', label: 'Content Analysis' },
];

interface UrlStatus {
  url: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

export default function BulkToolRunner({ onRunUrl, onClose }: Props) {
  const [urlInput, setUrlInput] = useState('');
  const [selectedTool, setSelectedTool] = useState(BULK_TOOLS[0].id);
  const [running, setRunning] = useState(false);
  const [urlStatuses, setUrlStatuses] = useState<UrlStatus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const urls = urlInput.split('\n').map((u) => u.trim()).filter(Boolean);

  const handleRun = async () => {
    if (urls.length === 0) return;
    setRunning(true);
    const statuses: UrlStatus[] = urls.map((url) => ({ url, status: 'pending' }));
    setUrlStatuses(statuses);

    for (let i = 0; i < urls.length; i++) {
      setCurrentIndex(i);
      setUrlStatuses((prev) =>
        prev.map((s, j) => (j === i ? { ...s, status: 'running' } : s))
      );

      try {
        onRunUrl(selectedTool, urls[i]);
        // Small delay between executions
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setUrlStatuses((prev) =>
          prev.map((s, j) => (j === i ? { ...s, status: 'done' } : s))
        );
      } catch {
        setUrlStatuses((prev) =>
          prev.map((s, j) => (j === i ? { ...s, status: 'error' } : s))
        );
      }
    }

    setRunning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain">
      <div className="absolute inset-0 bg-background/70" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Bulk Tool Runner</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Tool</label>
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            disabled={running}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none"
          >
            {BULK_TOOLS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">URLs (one per line)</label>
          <textarea
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={running}
            rows={6}
            placeholder={"https://example.com\nhttps://example.com/about\nhttps://example.com/pricing"}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono outline-none resize-y"
          />
          <p className="text-[10px] text-muted-foreground">{urls.length} URL{urls.length !== 1 ? 's' : ''} detected</p>
        </div>

        {urlStatuses.length > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {urlStatuses.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1">
                {s.status === 'running' && <Loader2 size={12} className="animate-spin text-sky-400" />}
                {s.status === 'done' && <CheckCircle size={12} className="text-emerald-400" />}
                {s.status === 'error' && <AlertCircle size={12} className="text-red-400" />}
                {s.status === 'pending' && <div className="w-3 h-3 rounded-full border border-border" />}
                <span className="truncate font-mono text-muted-foreground">{s.url}</span>
              </div>
            ))}
            {running && (
              <p className="text-xs text-sky-400 font-medium mt-1">
                Running {currentIndex + 1} of {urls.length}...
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={handleRun} disabled={running || urls.length === 0} size="sm" className="gap-1.5">
            {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            {running ? 'Running...' : 'Run All'}
          </Button>
          <Button onClick={onClose} variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
