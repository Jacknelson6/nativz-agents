import { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function InputBar({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = Math.min(ref.current.scrollHeight, 150) + 'px';
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContent = text.trim().length > 0;

  return (
    <div className="px-6 pb-5 pt-2">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-3 bg-zinc-900 border border-zinc-800/80 rounded-xl px-4 py-2.5 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700/50 transition-all duration-200">
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            rows={1}
            disabled={disabled}
            className="flex-1 bg-transparent resize-none text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600 py-1 max-h-[150px] leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={!hasContent || disabled}
            className={`p-1.5 rounded-lg shrink-0 transition-all duration-150 ${
              hasContent && !disabled
                ? 'bg-blue-500 text-white hover:bg-blue-400 shadow-sm shadow-blue-500/20'
                : 'bg-zinc-800 text-zinc-600'
            }`}
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-2 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
