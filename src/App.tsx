import { useEffect, useState } from "react";
import { useAppStore } from "./stores/appStore";
import { useAgentStore } from "./stores/agentStore";
import Layout from "./components/layout/Layout";
import AgentPicker from "./components/agents/AgentPicker";
import ChatView from "./components/chat/ChatView";
import Welcome from "./components/onboarding/Welcome";
import ApiKeySetup from "./components/onboarding/ApiKeySetup";
import RoleSelect from "./components/onboarding/RoleSelect";
import Settings from "./components/settings/Settings";
import Dashboard from "./components/analytics/Dashboard";
import KnowledgeBrowser from "./components/knowledge/KnowledgeBrowser";
import AgentMarketplace from "./components/agents/AgentMarketplace";
import type { AppSettings } from "./lib/types";

function Onboarding() {
  const [step, setStep] = useState(0);
  const { updateSettings, setView } = useAppStore();
  const { loadAgents } = useAgentStore();

  const finishOnboarding = async (role: AppSettings["role"]) => {
    await updateSettings({ role, onboardingComplete: true });
    await loadAgents();
    setView("home");
  };

  if (step === 0) return <Welcome onNext={() => setStep(1)} />;
  if (step === 1)
    return (
      <ApiKeySetup
        onNext={(key) => {
          if (key) updateSettings({ apiKey: key });
          setStep(2);
        }}
      />
    );
  return <RoleSelect onSelect={finishOnboarding} />;
}

export default function App() {
  const { currentView, loadSettings, loaded, settings } = useAppStore();
  const { loadAgents, selectedAgent } = useAgentStore();

  useEffect(() => {
    loadSettings().then(() => loadAgents());
  }, []);

  // Apply dark mode class
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [settings.theme]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        useAppStore.getState().toggleSettings();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        useAgentStore.getState().selectAgent(null);
        useAppStore.getState().setView("home");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  if (currentView === "onboarding") {
    return (
      <>
        <Onboarding />
        <Settings />
      </>
    );
  }

  return (
    <>
      <Layout>
        {currentView === "home" && <AgentPicker />}
        {currentView === "chat" && <ChatView />}
        {currentView === "analytics" && <Dashboard />}
        {currentView === "knowledge" && (
          <KnowledgeBrowser agentId={selectedAgent?.id ?? "global"} />
        )}
        {currentView === "marketplace" && <AgentMarketplace />}
        {currentView === "agent-profile" && <AgentPicker />}
      </Layout>
      <Settings />
    </>
  );
}
