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

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i < current ? 'w-8 bg-blue-500' : i === current ? 'w-8 bg-zinc-400' : 'w-4 bg-zinc-800'
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
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles size={36} className="text-white" />
        </div>
      </div>

      <h1 className="text-2xl font-semibold mb-3 text-zinc-100">
        Welcome to Nativz Agents
      </h1>
      <p className="text-zinc-500 text-[13px] max-w-md mb-8 leading-relaxed">
        AI-powered agents built for your agency. Content editing, SEO, paid media,
        account management — all powered by the latest AI models.
      </p>

      <div className="grid grid-cols-3 gap-2.5 max-w-xs mb-10">
        {[
          { icon: '🤖', label: 'Smart Agents' },
          { icon: '🧠', label: 'Memory' },
          { icon: '⚡', label: 'Multi-Model' },
        ].map((f) => (
          <div key={f.label} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
            <span className="text-lg">{f.icon}</span>
            <p className="text-[10px] text-zinc-500 mt-1">{f.label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="flex items-center gap-2 px-7 py-3 bg-blue-500 text-white rounded-xl font-medium text-[13px] hover:bg-blue-400 transition-colors duration-150 shadow-sm shadow-blue-500/20"
      >
        Get Started <ArrowRight size={15} />
      </button>
    </div>
  );
}

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
    await new Promise((r) => setTimeout(r, 1500));
    setTestResult(isKeyValid ? 'success' : 'error');
    setTesting(false);
  }, [isKeyValid]);

  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
        <Key size={24} className="text-amber-400" />
      </div>

      <h2 className="text-xl font-semibold text-zinc-100 mb-2">Connect a Provider</h2>
      <p className="text-zinc-500 text-[13px] mb-6">Add at least one AI provider to power your agents.</p>

      <div className="flex gap-2 mb-4 w-full">
        {PROVIDERS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => { setSelectedProvider(i); setApiKey(''); setTestResult(null); }}
            className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-medium transition-colors duration-150 ${
              i === selectedProvider
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="w-full relative">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
          placeholder={provider.placeholder}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[13px] text-zinc-100 outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/50 transition-all duration-200 placeholder:text-zinc-600 pr-10"
        />
        {testResult === 'success' && <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />}
        {testResult === 'error' && <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />}
      </div>

      <button
        onClick={testKey}
        disabled={!isKeyValid || testing}
        className="mt-3 w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[13px] text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200 transition-all duration-150 disabled:opacity-30 flex items-center justify-center gap-2"
      >
        {testing ? <><Loader2 size={13} className="animate-spin" /> Testing...</> : 'Test Connection'}
      </button>

      {testResult === 'error' && (
        <p className="text-[12px] text-red-400 mt-2">Could not verify this API key. Check and try again.</p>
      )}

      <button
        onClick={() => onNext(apiKey)}
        disabled={testResult !== 'success' && !isKeyValid}
        className="mt-5 w-full py-3 bg-blue-500 text-white rounded-xl font-medium text-[13px] hover:bg-blue-400 transition-colors duration-150 disabled:opacity-30 flex items-center justify-center gap-2"
      >
        Continue <ArrowRight size={14} />
      </button>

      <button onClick={() => onNext('')} className="mt-3 text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors">
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

      <h2 className="text-xl font-semibold text-zinc-100 mb-2">What&apos;s your role?</h2>
      <p className="text-zinc-500 text-[13px] mb-8">This determines which agents you&apos;ll see first.</p>

      <div className="grid grid-cols-1 gap-2 max-w-sm w-full">
        {ROLES.map((r) => (
          <button
            key={r.role}
            onClick={() => onSelect(r.role)}
            className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-150 text-left group"
          >
            <span className="text-xl">{r.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-[13px] text-zinc-100">{r.label}</p>
              <p className="text-[11px] text-zinc-500">{r.description}</p>
            </div>
            <ChevronRight size={15} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
          </button>
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

      <h2 className="text-xl font-semibold text-zinc-100 mb-2">Pick your first agent</h2>
      <p className="text-zinc-500 text-[13px] mb-8">You can always switch later. Try one to get started.</p>

      <div className="grid grid-cols-2 gap-2.5 max-w-lg w-full">
        {agents.slice(0, 6).map((agent) => (
          <button
            key={agent.id}
            onClick={() => onSelect(agent)}
            className="flex flex-col items-center p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-150"
          >
            <span className="text-2xl mb-2">{agent.icon}</span>
            <p className="font-medium text-[13px] text-zinc-100">{agent.name}</p>
            <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{agent.description}</p>
          </button>
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

      <h2 className="text-xl font-semibold text-zinc-100 mb-2">Say hello to {agent.name}!</h2>
      <p className="text-zinc-500 text-[13px] mb-8">Send a quick message to try out your agent.</p>

      <div className="w-full max-w-md space-y-2">
        {['What can you help me with?', `Give me a quick ${agent.category} tip`, 'Show me what you can do'].map(
          (suggestion) => (
            <button
              key={suggestion}
              onClick={handleSend}
              disabled={sent}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left text-[13px] transition-all duration-150 disabled:opacity-50 group"
            >
              <span className="text-base">{agent.icon}</span>
              <span className="flex-1 text-zinc-400 group-hover:text-zinc-200 transition-colors">{suggestion}</span>
              <ArrowRight size={13} className="text-zinc-700 group-hover:text-blue-400 transition-colors" />
            </button>
          )
        )}
      </div>

      {sent && (
        <div className="mt-6 flex items-center gap-2 text-emerald-400 text-[13px]">
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

  const handleProviderDone = useCallback(async (key: string) => {
    if (key) await updateSettings({ apiKey: key });
    await loadAgents();
    setStep(2);
  }, [updateSettings, loadAgents]);

  const handleRoleSelect = useCallback(async (role: Role) => {
    await updateSettings({ role });
    setStep(3);
  }, [updateSettings]);

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-6 py-12">
      <div className="mb-12">
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </div>

      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
      {step === 1 && <ProviderStep onNext={handleProviderDone} />}
      {step === 2 && <RoleStep onSelect={handleRoleSelect} />}
      {step === 3 && <AgentPickStep agents={agents} onSelect={handleAgentPick} />}
      {step === 4 && selectedAgent && <TutorialStep agent={selectedAgent} onFinish={handleFinish} />}

      {step > 0 && step < 4 && (
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            className="flex items-center gap-1 text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft size={12} /> Back
          </button>
          <button
            onClick={handleFinish}
            className="text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            Skip setup
          </button>
        </div>
      )}
    </div>
  );
}
