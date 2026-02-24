import { useState, useCallback } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useAgentStore } from '../../stores/agentStore';
import type { AppSettings, Agent } from '../../lib/types';

// ─── Constants ───────────────────────────────────────────────────────────────

type Role = AppSettings['role'];

const ROLES: { role: Role; label: string; icon: string; description: string }[] = [
  { role: 'admin', label: 'Admin', icon: '👑', description: 'Full access to all agents and settings' },
  { role: 'editor', label: 'Content Editor', icon: '✏️', description: 'Content creation and editing tools' },
  { role: 'paid-media', label: 'Paid Media', icon: '📢', description: 'Campaign and ad management' },
  { role: 'account-manager', label: 'Account Manager', icon: '📋', description: 'Client management and reporting' },
  { role: 'developer', label: 'Developer', icon: '💻', description: 'All agents plus developer tools' },
];

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', prefix: 'sk-ant-', placeholder: 'sk-ant-api...' },
  { id: 'openai', name: 'OpenAI', prefix: 'sk-', placeholder: 'sk-...' },
  { id: 'google', name: 'Google AI', prefix: 'AI', placeholder: 'AIza...' },
];

const TOTAL_STEPS = 5;

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i < current ? 'w-8 bg-accent' : i === current ? 'w-8 bg-white/60' : 'w-4 bg-white/10'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Step 1: Welcome ─────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Animated icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shadow-lg shadow-accent/20">
          <Sparkles size={40} className="text-white" />
        </div>
        <div className="absolute -inset-4 rounded-3xl bg-accent/10 animate-pulse -z-10" />
      </div>

      <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
        Welcome to Nativz Agents
      </h1>
      <p className="text-zinc-400 text-sm max-w-md mb-8 leading-relaxed">
        AI-powered agents built for your agency. Content editing, SEO, paid media,
        account management — all powered by the latest AI models.
      </p>

      {/* Feature preview */}
      <div className="grid grid-cols-3 gap-3 max-w-sm mb-10">
        {[
          { icon: '🤖', label: 'Smart Agents' },
          { icon: '🧠', label: 'Memory' },
          { icon: '⚡', label: 'Multi-Model' },
        ].map((f) => (
          <div key={f.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <span className="text-xl">{f.icon}</span>
            <p className="text-[10px] text-zinc-400 mt-1">{f.label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="flex items-center gap-2 px-8 py-3 bg-accent text-white rounded-xl font-medium text-sm hover:bg-accent/80 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        Get Started <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ─── Step 2: Provider Setup ──────────────────────────────────────────────────

function ProviderStep({ onNext }: { onNext: (key: string) => void }) {
  const [selectedProvider, setSelectedProvider] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const provider = PROVIDERS[selectedProvider];

  const isKeyValid = apiKey.length > 10;

  const testKey = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    // Simulate API key test
    await new Promise((r) => setTimeout(r, 1500));
    setTestResult(isKeyValid ? 'success' : 'error');
    setTesting(false);
  }, [isKeyValid]);

  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto">
      <div className="p-4 rounded-2xl bg-amber-500/10 mb-6">
        <Key size={32} className="text-amber-400" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Connect a Provider</h2>
      <p className="text-zinc-400 text-sm mb-6">
        Add at least one AI provider to power your agents.
      </p>

      {/* Provider tabs */}
      <div className="flex gap-2 mb-4 w-full">
        {PROVIDERS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => {
              setSelectedProvider(i);
              setApiKey('');
              setTestResult(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              i === selectedProvider
                ? 'bg-accent/10 text-accent border border-accent/30'
                : 'bg-white/[0.03] text-zinc-400 border border-white/5 hover:border-white/10'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* API key input */}
      <div className="w-full relative">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setTestResult(null);
          }}
          placeholder={provider.placeholder}
          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent/50 transition-colors pr-10"
        />
        {testResult === 'success' && (
          <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
        )}
        {testResult === 'error' && (
          <AlertCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
        )}
      </div>

      {/* Test button */}
      <button
        onClick={testKey}
        disabled={!isKeyValid || testing}
        className="mt-3 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 hover:bg-white/10 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
      >
        {testing ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Testing...
          </>
        ) : (
          'Test Connection'
        )}
      </button>

      {testResult === 'error' && (
        <p className="text-xs text-red-400 mt-2">Could not verify this API key. Check and try again.</p>
      )}

      <div className="flex gap-3 mt-6 w-full">
        <button
          onClick={() => onNext(apiKey)}
          disabled={testResult !== 'success' && !isKeyValid}
          className="flex-1 py-3 bg-accent text-white rounded-xl font-medium text-sm hover:bg-accent/80 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
        >
          Continue <ArrowRight size={14} />
        </button>
      </div>

      <button
        onClick={() => onNext('')}
        className="mt-3 text-xs text-zinc-500 hover:text-white transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}

// ─── Step 3: Role Selection ──────────────────────────────────────────────────

function RoleStep({ onSelect }: { onSelect: (role: Role) => void }) {
  const [hoveredRole, setHoveredRole] = useState<Role | null>(null);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="p-4 rounded-2xl bg-sky-500/10 mb-6">
        <Users size={32} className="text-sky-400" />
      </div>

      <h2 className="text-2xl font-bold mb-2">What&apos;s your role?</h2>
      <p className="text-zinc-400 text-sm mb-8">This determines which agents you&apos;ll see first.</p>

      <div className="grid grid-cols-1 gap-2 max-w-sm w-full">
        {ROLES.map((r) => (
          <button
            key={r.role}
            onClick={() => onSelect(r.role)}
            onMouseEnter={() => setHoveredRole(r.role)}
            onMouseLeave={() => setHoveredRole(null)}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
              hoveredRole === r.role
                ? 'bg-accent/5 border-accent/30 scale-[1.01]'
                : 'bg-white/[0.02] border-white/5 hover:border-white/10'
            }`}
          >
            <span className="text-2xl">{r.icon}</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{r.label}</p>
              <p className="text-xs text-zinc-500">{r.description}</p>
            </div>
            <ChevronRight size={16} className="text-zinc-600" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 4: Pick Agent ──────────────────────────────────────────────────────

function AgentPickStep({
  agents,
  onSelect,
}: {
  agents: Agent[];
  onSelect: (agent: Agent) => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="p-4 rounded-2xl bg-emerald-500/10 mb-6">
        <Bot size={32} className="text-emerald-400" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Pick your first agent</h2>
      <p className="text-zinc-400 text-sm mb-8">You can always switch later. Try one to get started.</p>

      <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
        {agents.slice(0, 6).map((agent) => (
          <button
            key={agent.id}
            onClick={() => onSelect(agent)}
            className="flex flex-col items-center p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-accent/30 hover:bg-accent/5 transition-all"
          >
            <span className="text-3xl mb-2">{agent.icon}</span>
            <p className="font-semibold text-sm">{agent.name}</p>
            <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{agent.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 5: Tutorial ────────────────────────────────────────────────────────

function TutorialStep({
  agent,
  onFinish,
}: {
  agent: Agent;
  onFinish: () => void;
}) {
  const [sent, setSent] = useState(false);

  const handleSend = useCallback(() => {
    setSent(true);
    // Small delay to show the animation
    setTimeout(onFinish, 1500);
  }, [onFinish]);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="p-4 rounded-2xl bg-purple-500/10 mb-6">
        <MessageSquare size={32} className="text-purple-400" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Say hello to {agent.name}!</h2>
      <p className="text-zinc-400 text-sm mb-8">
        Send a quick message to try out your agent.
      </p>

      <div className="w-full max-w-md space-y-3">
        {['What can you help me with?', `Give me a quick ${agent.category} tip`, 'Show me what you can do'].map(
          (suggestion) => (
            <button
              key={suggestion}
              onClick={handleSend}
              disabled={sent}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-accent/30 text-left text-sm transition-all disabled:opacity-50"
            >
              <span className="text-lg">{agent.icon}</span>
              <span className="flex-1 text-zinc-300">{suggestion}</span>
              <ArrowRight size={14} className="text-zinc-600" />
            </button>
          )
        )}
      </div>

      {sent && (
        <div className="mt-6 flex items-center gap-2 text-emerald-400 text-sm">
          <CheckCircle2 size={16} />
          <span>Message sent! Opening chat...</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Onboarding ─────────────────────────────────────────────────────────

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
    setView('chat');
  }, [updateSettings, selectedAgent, selectAgent, setView]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-6 py-12">
      {/* Step indicator */}
      <div className="mb-12">
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </div>

      {/* Steps */}
      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
      {step === 1 && <ProviderStep onNext={handleProviderDone} />}
      {step === 2 && <RoleStep onSelect={handleRoleSelect} />}
      {step === 3 && <AgentPickStep agents={agents} onSelect={handleAgentPick} />}
      {step === 4 && selectedAgent && <TutorialStep agent={selectedAgent} onFinish={handleFinish} />}

      {/* Skip all */}
      {step > 0 && step < 4 && (
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={12} /> Back
          </button>
          <button
            onClick={handleFinish}
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            Skip setup
          </button>
        </div>
      )}
    </div>
  );
}
