import { useEffect, useState } from 'react';
import { useAppStore } from './stores/appStore';
import { useAgentStore } from './stores/agentStore';
import Layout from './components/layout/Layout';
import AgentPicker from './components/agents/AgentPicker';
import ChatView from './components/chat/ChatView';
import Welcome from './components/onboarding/Welcome';
import ApiKeySetup from './components/onboarding/ApiKeySetup';
import RoleSelect from './components/onboarding/RoleSelect';
import Settings from './components/settings/Settings';
import Dashboard from './components/analytics/Dashboard';
import type { AppSettings } from './lib/types';

function Onboarding() {
  const [step, setStep] = useState(0);
  const { updateSettings, setView } = useAppStore();
  const { loadAgents } = useAgentStore();

  const finishOnboarding = async (role: AppSettings['role']) => {
    await updateSettings({ role, onboardingComplete: true });
    await loadAgents();
    setView('home');
  };

  if (step === 0) return <Welcome onNext={() => setStep(1)} />;
  if (step === 1) return <ApiKeySetup onNext={(key) => { if (key) updateSettings({ apiKey: key }); setStep(2); }} />;
  return <RoleSelect onSelect={finishOnboarding} />;
}

export default function App() {
  const { currentView, settingsOpen, loadSettings, loaded } = useAppStore();
  const { loadAgents } = useAgentStore();

  useEffect(() => {
    loadSettings().then(() => loadAgents());
  }, []);

  if (!loaded) {
    return <div className="flex items-center justify-center h-screen bg-black text-muted text-sm">Loading...</div>;
  }

  if (currentView === 'onboarding') {
    return (
      <>
        <Onboarding />
        {settingsOpen && <Settings />}
      </>
    );
  }

  return (
    <>
      <Layout>
        {currentView === 'home' && <AgentPicker />}
        {currentView === 'chat' && <ChatView />}
        {currentView === 'analytics' && <Dashboard />}
      </Layout>
      {settingsOpen && <Settings />}
    </>
  );
}
