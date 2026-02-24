import { useState } from 'react';
import { CheckCircle2, Key } from 'lucide-react';

interface Props {
  onNext: (key: string) => void;
}

export default function ApiKeySetup({ onNext }: Props) {
  const [key, setKey] = useState('');
  const isValid = key.startsWith('sk-ant-') && key.length > 20;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-center px-6">
      <div className="p-4 rounded-2xl bg-accent/10 mb-6">
        <Key size={32} className="text-accent" />
      </div>
      <h2 className="text-2xl font-bold mb-2">API Key</h2>
      <p className="text-muted text-sm max-w-md mb-6">
        Enter your Anthropic API key to power the agents.
      </p>
      <div className="w-full max-w-md relative">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent/50 transition-colors pr-10"
        />
        {isValid && (
          <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-success" />
        )}
      </div>
      <button
        onClick={() => onNext(key)}
        disabled={!isValid}
        className="mt-6 px-8 py-3 bg-accent text-white rounded-xl font-medium text-sm hover:bg-accent/80 transition-colors disabled:opacity-30"
      >
        Continue
      </button>
      <button
        onClick={() => onNext('')}
        className="mt-3 text-xs text-muted hover:text-white transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}
