import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
        <Sparkles size={28} className="text-primary-foreground" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-3">Welcome to Nativz SEO</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-10 leading-relaxed">
        Your expert AI-powered SEO consultant. Technical audits, keyword research,
        content strategy, and competitive analysis — powered by Claude.
      </p>
      <Button onClick={onNext} size="lg" className="gap-2 px-8 shadow-sm">
        Get Started <ArrowRight size={16} />
      </Button>
    </div>
  );
}
