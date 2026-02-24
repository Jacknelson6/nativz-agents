import { useState, useCallback } from 'react';
import { Copy, RefreshCw, Pencil, GitBranch, Bookmark, Check } from 'lucide-react';
import type { Message } from '../../lib/types';

interface MessageActionsProps {
  message: Message;
  onRegenerate?: (messageId: string, model?: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onBranch?: (messageId: string) => void;
  onBookmark?: (messageId: string) => void;
  isBookmarked?: boolean;
}

const REGEN_MODELS = [
  { id: 'default', label: 'Same model' },
  { id: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gemini-2.0-flash', label: 'Gemini Flash' },
];

export default function MessageActions({
  message,
  onRegenerate,
  onEdit,
  onBranch,
  onBookmark,
  isBookmarked = false,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const handleRegenerate = useCallback(
    (model?: string) => {
      onRegenerate?.(message.id, model === 'default' ? undefined : model);
      setShowModelPicker(false);
    },
    [message.id, onRegenerate],
  );

  const handleEditSubmit = useCallback(() => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent);
    }
    setIsEditing(false);
  }, [editContent, message.id, message.content, onEdit]);

  const handleEditCancel = useCallback(() => {
    setEditContent(message.content);
    setIsEditing(false);
  }, [message.content]);

  const isUser = message.role === 'user';

  if (isEditing && isUser) {
    return (
      <div className="mt-2 space-y-2">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={3}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent resize-none"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button onClick={handleEditCancel} className="px-3 py-1 text-xs text-muted hover:text-text transition">
            Cancel
          </button>
          <button
            onClick={handleEditSubmit}
            className="px-3 py-1 text-xs bg-accent text-white rounded-md hover:bg-accent/90 transition"
          >
            Save & Regenerate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
      {/* Copy */}
      <button
        onClick={() => void handleCopy()}
        className="p-1.5 rounded-md text-muted hover:text-text hover:bg-surface transition"
        title="Copy"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>

      {/* Regenerate (assistant messages) */}
      {!isUser && onRegenerate && (
        <div className="relative">
          <button
            onClick={() => handleRegenerate()}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowModelPicker(!showModelPicker);
            }}
            className="p-1.5 rounded-md text-muted hover:text-text hover:bg-surface transition"
            title="Regenerate (right-click for model picker)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {showModelPicker && (
            <div className="absolute bottom-full left-0 mb-1 bg-surface border border-border rounded-lg py-1 w-48 shadow-xl z-50">
              <p className="px-3 py-1 text-[10px] text-muted uppercase tracking-wider">Regenerate with</p>
              {REGEN_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleRegenerate(m.id)}
                  className="w-full text-left px-3 py-1.5 text-xs text-text hover:bg-border transition"
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit (user messages) */}
      {isUser && onEdit && (
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 rounded-md text-muted hover:text-text hover:bg-surface transition"
          title="Edit message"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Branch */}
      {onBranch && (
        <button
          onClick={() => onBranch(message.id)}
          className="p-1.5 rounded-md text-muted hover:text-text hover:bg-surface transition"
          title="Branch conversation"
        >
          <GitBranch className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Bookmark */}
      {onBookmark && (
        <button
          onClick={() => onBookmark(message.id)}
          className={`p-1.5 rounded-md transition ${
            isBookmarked ? 'text-yellow-400 hover:text-yellow-300' : 'text-muted hover:text-text'
          } hover:bg-surface`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      )}

      {/* Dismiss model picker on outside click */}
      {showModelPicker && (
        <div className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)} />
      )}
    </div>
  );
}
