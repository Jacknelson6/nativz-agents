import { useEffect, useState, lazy, Suspense } from "react";
import { useAppStore } from "./stores/appStore";
import { useAgentStore } from "./stores/agentStore";
import Layout from "./components/layout/Layout";
import AgentPicker from "./components/agents/AgentPicker";
import ChatView from "./components/chat/ChatView";
import Welcome from "./components/onboarding/Welcome";
import ApiKeySetup from "./components/onboarding/ApiKeySetup";
import Settings from "./components/settings/Settings";
import ErrorBoundary from "./components/chat/ErrorBoundary";

// Lazy-loaded routes (not needed on initial render)
const KnowledgeBrowser = lazy(() => import("./components/knowledge/KnowledgeBrowser"));
const Dashboard = lazy(() => import("./components/analytics/Dashboard"));
const SeoToolsView = lazy(() => import("./components/seo/SeoToolsView"));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs text-muted-foreground/60">Loading...</p>
      </div>
    </div>
  );
}

function Onboarding() {
  const [step, setStep] = useState(0);
  const { updateSettings, setView } = useAppStore();
  const { loadAgents } = useAgentStore();

  const finishOnboarding = async () => {
    await updateSettings({ 
      role: "admin", 
      onboardingComplete: true,
      apiKeys: { anthropic: useAppStore.getState().settings.apiKey }
    });
    await loadAgents();
    setView("home");
  };

  if (step === 0) return <Welcome onNext={() => setStep(1)} />;
  return (
    <ApiKeySetup
      onNext={(key) => {
        if (key) updateSettings({ apiKey: key });
        finishOnboarding();
      }}
    />
  );
}

export default function App() {
  const { currentView, loadSettings, loaded, settings } = useAppStore();
  const { loadAgents, selectedAgent } = useAgentStore();

  useEffect(() => {
    loadSettings().then(() => loadAgents());
  }, []);

  // Start health check when app is loaded and past onboarding
  useEffect(() => {
    if (loaded && currentView !== 'onboarding') {
      useAppStore.getState().startHealthCheck();
    }
    return () => {
      useAppStore.getState().stopHealthCheck();
    };
  }, [loaded, currentView]);

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
        useAppStore.getState().setView("chat");
      }
      // Cmd+1-5: navigate between views
      const viewMap: Record<string, string> = { "1": "home", "2": "chat", "3": "knowledge", "4": "analytics", "5": "tools" };
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && viewMap[e.key]) {
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useAppStore.getState().setView(viewMap[e.key] as any);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold shadow-lg">
            N
          </div>
          <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin mt-2" />
        </div>
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
        <ErrorBoundary>
          {currentView === "home" && <AgentPicker />}
          {currentView === "agent-select" && <AgentPicker />}
          {currentView === "chat" && <ChatView />}
          {currentView === "knowledge" && (
            <Suspense fallback={<LazyFallback />}>
              <KnowledgeBrowser agentId={selectedAgent?.id ?? "global"} />
            </Suspense>
          )}
          {currentView === "analytics" && (
            <Suspense fallback={<LazyFallback />}>
              <Dashboard />
            </Suspense>
          )}
          {currentView === "tools" && (
            <Suspense fallback={<LazyFallback />}>
              <SeoToolsView />
            </Suspense>
          )}
        </ErrorBoundary>
      </Layout>
      <Settings />
    </>
  );
}
