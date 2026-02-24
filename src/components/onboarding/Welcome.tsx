import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg">
        <Sparkles size={28} className="text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-semibold mb-2">Welcome to Nativz Agents</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
        AI-powered agents built for your agency. Content editing, SEO, paid media,
        account management — all powered by Claude.
      </p>
      <Button onClick={onNext} className="gap-2">
        Get Started <ArrowRight size={15} />
      </Button>
    </div>
  );
}
