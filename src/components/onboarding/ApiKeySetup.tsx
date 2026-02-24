import { useState } from "react";
import { CheckCircle2, Key, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onNext: (key: string) => void;
}

export default function ApiKeySetup({ onNext }: Props) {
  const [key, setKey] = useState("");
  const isValid = key.startsWith("sk-ant-") && key.length > 20;

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
        <Key size={24} className="text-amber-400" />
      </div>
      <h2 className="text-xl font-semibold mb-2">API Key</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        Enter your Anthropic API key to power the agents.
      </p>
      <div className="w-full max-w-md relative">
        <Input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-ant-..."
        />
        {isValid && (
          <CheckCircle2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400"
          />
        )}
      </div>
      <Button
        onClick={() => onNext(key)}
        disabled={!isValid}
        className="mt-6 gap-2"
      >
        Continue <ArrowRight size={14} />
      </Button>
      <button
        onClick={() => onNext("")}
        className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}
