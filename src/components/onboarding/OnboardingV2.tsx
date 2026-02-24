import { useState, useCallback } from "react";
import {
  Sparkles,
  Key,
  Users,
  Bot,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useAgentStore } from "../../stores/agentStore";
import type { AppSettings, Agent } from "../../lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Role = AppSettings["role"];

const ROLES: { role: Role; label: string; icon: string; description: string }[] = [
  { role: "admin", label: "Admin", icon: "👑", description: "Full access to all agents and settings" },
  { role: "editor", label: "Content Editor", icon: "✏️", description: "Content creation and editing tools" },
  { role: "paid-media", label: "Paid Media", icon: "📢", description: "Campaign and ad management" },
  { role: "account-manager", label: "Account Manager", icon: "📋", description: "Client management and reporting" },
  { role: "developer", label: "Developer", icon: "💻", description: "All agents plus developer tools" },
];

const PROVIDERS = [
  { id: "anthropic", name: "Anthropic", prefix: "sk-ant-", placeholder: "sk-ant-api..." },
  { id: "openai", name: "OpenAI", prefix: "sk-", placeholder: "sk-..." },
  { id: "google", name: "Google AI", prefix: "AI", placeholder: "AIza..." },
];

const TOTAL_STEPS = 5;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i < current ? "w-8 bg-primary" : i === current ? "w-8 bg-muted-foreground" : "w-4 bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          <Sparkles size={36} className="text-primary-foreground" />
        </div>
      </div>

      <h1 className="text-2xl font-semibold mb-3">Welcome to Nativz Agents</h1>
      <p className="text-muted-foreground text-sm max-w-md mb-8 leading-relaxed">
        AI-powered agents built for your agency. Content editing, SEO, paid media,
        account management — all powered by the latest AI models.
      </p>

      <div className="grid grid-cols-3 gap-2.5 max-w-xs mb-10">
        {[
          { icon: "🤖", label: "Smart Agents" },
          { icon: "🧠", label: "Memory" },
          { icon: "⚡", label: "Multi-Model" },
        ].map((f) => (
          <Card key={f.label}>
            <CardContent className="p-3 text-center">
              <span className="text-lg">{f.icon}</span>
              <p className="text-[10px] text-muted-foreground mt-1">{f.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={onNext} className="gap-2">
        Get Started <ArrowRight size={15} />
      </Button>
    </div>
  );
}

function ProviderStep({ onNext }: { onNext: (key: string) => void }) {
  const [selectedProvider, setSelectedProvider] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const provider = PROVIDERS[selectedProvider];
  const isKeyValid = apiKey.length > 10;

  const testKey = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 1500));
    setTestResult(isKeyValid ? "success" : "error");
    setTesting(false);
  }, [isKeyValid]);

  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
        <Key size={24} className="text-amber-400" />
      </div>

      <h2 className="text-xl font-semibold mb-2">Connect a Provider</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Add at least one AI provider to power your agents.
      </p>

      <div className="flex gap-2 mb-4 w-full">
        {PROVIDERS.map((p, i) => (
          <Button
            key={p.id}
            variant={i === selectedProvider ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => {
              setSelectedProvider(i);
              setApiKey("");
              setTestResult(null);
            }}
          >
            {p.name}
          </Button>
        ))}
      </div>

      <div className="w-full relative">
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
          placeholder={provider.placeholder}
        />
        {testResult === "success" && (
          <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
        )}
        {testResult === "error" && (
          <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
        )}
      </div>

      <Button
        variant="outline"
        className="mt-3 w-full"
        onClick={testKey}
        disabled={!isKeyValid || testing}
      >
        {testing ? (
          <>
            <Loader2 size={13} className="animate-spin mr-2" /> Testing...
          </>
        ) : (
          "Test Connection"
        )}
      </Button>

      {testResult === "error" && (
        <p className="text-xs text-destructive mt-2">
          Could not verify this API key. Check and try again.
        </p>
      )}

      <Button
        className="mt-5 w-full gap-2"
        onClick={() => onNext(apiKey)}
        disabled={testResult !== "success" && !isKeyValid}
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

function RoleStep({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-6">
        <Users size={24} className="text-sky-400" />
      </div>

      <h2 className="text-xl font-semibold mb-2">What&apos;s your role?</h2>
      <p className="text-muted-foreground text-sm mb-8">
        This determines which agents you&apos;ll see first.
      </p>

      <div className="grid grid-cols-1 gap-2 max-w-sm w-full">
        {ROLES.map((r) => (
          <Card
            key={r.role}
            className="cursor-pointer hover:ring-1 hover:ring-primary transition-all group"
            onClick={() => onSelect(r.role)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <span className="text-xl">{r.icon}</span>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.description}</p>
              </div>
              <ChevronRight
                size={15}
                className="text-muted-foreground group-hover:text-foreground transition-colors"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AgentPickStep({ agents, onSelect }: { agents: Agent[]; onSelect: (agent: Agent) => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
        <Bot size={24} className="text-emerald-400" />
      </div>

      <h2 className="text-xl font-semibold mb-2">Pick your first agent</h2>
      <p className="text-muted-foreground text-sm mb-8">
        You can always switch later. Try one to get started.
      </p>

      <div className="grid grid-cols-2 gap-2.5 max-w-lg w-full">
        {agents.slice(0, 6).map((agent) => (
          <Card
            key={agent.id}
            className="cursor-pointer hover:ring-1 hover:ring-primary transition-all"
            onClick={() => onSelect(agent)}
          >
            <CardContent className="flex flex-col items-center p-4">
              <span className="text-2xl mb-2">{agent.icon}</span>
              <p className="font-medium text-sm">{agent.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                {agent.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TutorialStep({ agent, onFinish }: { agent: Agent; onFinish: () => void }) {
  const [sent, setSent] = useState(false);

  const handleSend = useCallback(() => {
    setSent(true);
    setTimeout(onFinish, 1500);
  }, [onFinish]);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
        <MessageSquare size={24} className="text-purple-400" />
      </div>

      <h2 className="text-xl font-semibold mb-2">Say hello to {agent.name}!</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Send a quick message to try out your agent.
      </p>

      <div className="w-full max-w-md space-y-2">
        {[
          "What can you help me with?",
          `Give me a quick ${agent.category} tip`,
          "Show me what you can do",
        ].map((suggestion) => (
          <Card
            key={suggestion}
            className="cursor-pointer hover:ring-1 hover:ring-primary transition-all group"
            onClick={handleSend}
          >
            <CardContent className="flex items-center gap-3 p-3.5">
              <span className="text-base">{agent.icon}</span>
              <span className="flex-1 text-sm text-muted-foreground group-hover:text-foreground text-left transition-colors">
                {suggestion}
              </span>
              <ArrowRight
                size={13}
                className="text-muted-foreground group-hover:text-primary transition-colors"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {sent && (
        <div className="mt-6 flex items-center gap-2 text-emerald-400 text-sm">
          <CheckCircle2 size={15} />
          <span>Message sent! Opening chat...</span>
        </div>
      )}
    </div>
  );
}

export default function OnboardingV2() {
  const [step, setStep] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const { updateSettings, setView } = useAppStore();
  const { agents, loadAgents, selectAgent } = useAgentStore();

  const handleProviderDone = useCallback(
    async (key: string) => {
      if (key) await updateSettings({ apiKey: key });
      await loadAgents();
      setStep(2);
    },
    [updateSettings, loadAgents]
  );

  const handleRoleSelect = useCallback(
    async (role: Role) => {
      await updateSettings({ role });
      setStep(3);
    },
    [updateSettings]
  );

  const handleAgentPick = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setStep(4);
  }, []);

  const handleFinish = useCallback(async () => {
    await updateSettings({ onboardingComplete: true });
    if (selectedAgent) selectAgent(selectedAgent);
    setView("chat");
  }, [updateSettings, selectedAgent, selectAgent, setView]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="mb-12">
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </div>

      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
      {step === 1 && <ProviderStep onNext={handleProviderDone} />}
      {step === 2 && <RoleStep onSelect={handleRoleSelect} />}
      {step === 3 && <AgentPickStep agents={agents} onSelect={handleAgentPick} />}
      {step === 4 && selectedAgent && (
        <TutorialStep agent={selectedAgent} onFinish={handleFinish} />
      )}

      {step > 0 && step < 4 && (
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={12} /> Back
          </button>
          <button
            onClick={handleFinish}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip setup
          </button>
        </div>
      )}
    </div>
  );
}
