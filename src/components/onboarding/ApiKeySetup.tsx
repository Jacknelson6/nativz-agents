import { useState, useCallback } from "react";
import { CheckCircle2, Key, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onNext: (key: string) => void;
}

export default function ApiKeySetup({ onNext }: Props) {
  const [key, setKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const looksValid = key.startsWith("sk-ant-") && key.length > 20;

  const testKey = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    setErrorMsg("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      if (res.ok || res.status === 200) {
        setTestResult("success");
      } else {
        const data = await res.json().catch(() => null);
        const msg = data?.error?.message || `HTTP ${res.status}`;
        setTestResult("error");
        setErrorMsg(msg);
      }
    } catch (e) {
      setTestResult("error");
      setErrorMsg(e instanceof Error ? e.message : "Network error");
    } finally {
      setTesting(false);
    }
  }, [key]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
        <Key size={24} className="text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">API Key</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
        Enter your Anthropic API key to power the SEO agent.
      </p>
      <div className="w-full max-w-md relative">
        <Input
          type="password"
          value={key}
          onChange={(e) => { setKey(e.target.value); setTestResult(null); }}
          placeholder="sk-ant-..."
        />
        {testResult === "success" && (
          <CheckCircle2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400"
          />
        )}
        {testResult === "error" && (
          <AlertCircle
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive"
          />
        )}
      </div>

      <Button
        variant="outline"
        className="mt-3 w-full max-w-md"
        onClick={testKey}
        disabled={!looksValid || testing}
      >
        {testing ? (
          <><Loader2 size={13} className="animate-spin mr-2" /> Verifying...</>
        ) : testResult === "success" ? (
          <><CheckCircle2 size={13} className="mr-2 text-emerald-400" /> Verified</>
        ) : (
          "Test Connection"
        )}
      </Button>

      {testResult === "error" && (
        <p className="text-xs text-destructive mt-2 max-w-md">
          {errorMsg || "Could not verify this API key. Check and try again."}
        </p>
      )}

      <Button
        onClick={() => onNext(key)}
        disabled={!looksValid || testResult !== "success"}
        className="mt-5 w-full max-w-md gap-2"
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
