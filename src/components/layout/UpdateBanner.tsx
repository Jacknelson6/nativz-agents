import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

declare const __APP_VERSION__: string;

const GITHUB_REPO = 'nativz/nativz-agents';
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const CURRENT_VERSION: string = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0';

interface ReleaseInfo {
  tag_name: string;
  html_url: string;
}

function compareVersions(current: string, latest: string): boolean {
  const clean = (v: string) => v.replace(/^v/, '').split('.').map(Number);
  const c = clean(current);
  const l = clean(latest);
  for (let i = 0; i < 3; i++) {
    if ((l[i] ?? 0) > (c[i] ?? 0)) return true;
    if ((l[i] ?? 0) < (c[i] ?? 0)) return false;
  }
  return false;
}

export default function UpdateBanner() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
          headers: { Accept: 'application/vnd.github.v3+json' },
        });
        if (!res.ok) return;
        const data = await res.json() as ReleaseInfo;
        if (compareVersions(CURRENT_VERSION, data.tag_name)) {
          setRelease(data);
        }
      } catch {
        // Silently fail — update checks are non-critical
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!release || dismissed) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-blue-600/20 border-b border-blue-500/30 text-sm">
      <div className="flex items-center gap-2 text-blue-300">
        <Download className="w-4 h-4" />
        <span>
          New version available: <strong>{release.tag_name}</strong>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={release.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-blue-500 hover:bg-blue-400 text-white rounded-md text-xs font-medium transition-colors"
        >
          Update
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-white/10 rounded transition-colors text-neutral-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
