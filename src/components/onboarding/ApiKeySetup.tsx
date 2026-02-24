import { useState } from 'react';
import { CheckCircle2, Key, ArrowRight } from 'lucide-react';

interface Props {
  onNext: (key: string) => void;
}

export default function ApiKeySetup({ onNext }: Props) {
  const [key, setKey] = useState('');
  const isValid = key.startsWith('sk-ant-') && key.length > 20;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
        <Key size={24} className="text-amber-400" />
      </div>
      <h2 className="text-xl font-semibold text-zinc-100 mb-2">API Key</h2>
      <p className="text-[13px] text-zinc-500 max-w-md mb-6 leading-relaxed">
        Enter your Anthropic API key to power the agents.
      </p>
      <div className="w-full max-w-md relative">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[13px] text-zinc-100 outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/50 transition-all duration-200 placeholder:text-zinc-600 pr-10"
        />
        {isValid && (
          <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
        )}
      </div>
      <button
        onClick={() => onNext(key)}
        disabled={!isValid}
        className="mt-6 flex items-center gap-2 px-7 py-3 bg-blue-500 text-white rounded-xl font-medium text-[13px] hover:bg-blue-400 transition-colors duration-150 disabled:opacity-30 disabled:hover:bg-blue-500"
      >
        Continue <ArrowRight size={14} />
      </button>
      <button
        onClick={() => onNext('')}
        className="mt-3 text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors duration-150"
      >
        Skip for now
      </button>
    </div>
  );
}
