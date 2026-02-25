import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import type { Message } from '../../lib/types';

interface MessageActionsProps {
  message: Message;
}

export default function MessageActions({ message }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => void handleCopy()}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
        title="Copy"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}
