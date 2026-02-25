import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, Clock } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'task-complete' | 'memory-updated' | 'scheduled';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  navigateTo?: string;
  autoDismissMs?: number;
}

// ── Global notification emitter (singleton) ────────────────────────────────

type NotificationListener = (notification: AppNotification) => void;
const listeners: NotificationListener[] = [];

export function emitNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): void {
  const full: AppNotification = {
    ...notification,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    read: false,
  };
  for (const listener of listeners) {
    listener(full);
  }
}

function subscribe(cb: NotificationListener): () => void {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

// ── Icon helper ────────────────────────────────────────────────────────────

function NotifIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'success':
    case 'task-complete':
      return <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
    case 'scheduled':
      return <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />;
    case 'memory-updated':
      return <Info className="w-4 h-4 text-purple-400 flex-shrink-0" />;
    default:
      return <Info className="w-4 h-4 text-primary flex-shrink-0" />;
  }
}

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ notification, onDismiss }: { notification: AppNotification; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const ms = notification.autoDismissMs ?? 5000;
    const timer = setTimeout(() => onDismiss(notification.id), ms);
    return () => clearTimeout(timer);
  }, [notification.id, notification.autoDismissMs, onDismiss]);

  return (
    <div className="flex items-start gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-2xl min-w-[300px] max-w-[400px] animate-slide-in">
      <NotifIcon type={notification.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{notification.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
      </div>
      <button onClick={() => onDismiss(notification.id)} className="p-0.5 text-muted-foreground hover:text-foreground transition flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function NotificationCenter() {
  const [toasts, setToasts] = useState<AppNotification[]>([]);

  useEffect(() => {
    return subscribe((notification) => {
      setToasts((prev) => [notification, ...prev].slice(0, 5));
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} notification={t} onDismiss={dismissToast} />
        ))}
      </div>
    </div>
  );
}
