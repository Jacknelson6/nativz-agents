import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Clock, Trash2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'task-complete' | 'memory-updated' | 'scheduled';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  /** Optional navigation target (e.g., conversation id, agent id) */
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

export default function NotificationCenter({ onNavigate }: { onNavigate?: (target: string) => void }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Subscribe to global notifications
  useEffect(() => {
    return subscribe((notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 100));
      setToasts((prev) => [notification, ...prev].slice(0, 5));
    });
  }, []);

  // Close panel on outside click or Escape key
  useEffect(() => {
    if (!panelOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [panelOpen]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleNotifClick = useCallback(
    (notif: AppNotification) => {
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
      if (notif.navigateTo && onNavigate) {
        onNavigate(notif.navigateTo);
      }
      setPanelOpen(false);
    },
    [onNavigate],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} notification={t} onDismiss={dismissToast} />
        ))}
      </div>

      {/* Bell button */}
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Panel */}
        {panelOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-primary hover:text-primary/80 transition">
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="p-1 text-muted-foreground hover:text-foreground transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-card transition border-b border-border/50 ${
                      notif.read ? 'opacity-60' : ''
                    }`}
                  >
                    <NotifIcon type={notif.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{notif.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
