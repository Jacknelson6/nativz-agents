// Global keyboard shortcuts

type ShortcutHandler = () => void;

interface Shortcut {
  key: string;
  meta?: boolean;
  handler: ShortcutHandler;
}

export function registerKeyboardShortcuts(shortcuts: Shortcut[]): () => void {
  const handler = (e: KeyboardEvent) => {
    for (const s of shortcuts) {
      const metaMatch = s.meta ? (e.metaKey || e.ctrlKey) : true;
      if (metaMatch && e.key === s.key) {
        e.preventDefault();
        s.handler();
        return;
      }
    }
  };

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}
