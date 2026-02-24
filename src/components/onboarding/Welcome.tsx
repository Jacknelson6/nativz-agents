import { Sparkles } from 'lucide-react';

export default function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-center px-6">
      <div className="p-4 rounded-2xl bg-accent/10 mb-6">
        <Sparkles size={40} className="text-accent" />
      </div>
      <h1 className="text-3xl font-bold mb-3">Welcome to Nativz Agents</h1>
      <p className="text-muted text-sm max-w-md mb-8 leading-relaxed">
        AI-powered agents built for your agency. Content editing, SEO, paid media, account management — all powered by Claude.
      </p>
      <button
        onClick={onNext}
        className="px-8 py-3 bg-accent text-white rounded-xl font-medium text-sm hover:bg-accent/80 transition-colors"
      >
        Get Started
      </button>
    </div>
  );
}
