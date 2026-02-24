import { Sparkles, ArrowRight } from 'lucide-react';

export default function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
        <Sparkles size={28} className="text-white" />
      </div>
      <h1 className="text-2xl font-semibold text-zinc-100 mb-2">Welcome to Nativz Agents</h1>
      <p className="text-[13px] text-zinc-500 max-w-md mb-8 leading-relaxed">
        AI-powered agents built for your agency. Content editing, SEO, paid media, account management — all powered by Claude.
      </p>
      <button
        onClick={onNext}
        className="flex items-center gap-2 px-7 py-3 bg-blue-500 text-white rounded-xl font-medium text-[13px] hover:bg-blue-400 transition-colors duration-150 shadow-sm shadow-blue-500/20"
      >
        Get Started <ArrowRight size={15} />
      </button>
    </div>
  );
}
