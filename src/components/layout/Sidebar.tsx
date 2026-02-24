import { useState, useEffect } from "react";
import { useAgentStore } from "../../stores/agentStore";
import { useAppStore } from "../../stores/appStore";
import { useChatStore } from "../../stores/chatStore";
import {
  listConversations,
  deleteConversation as deleteTauriConv,
  loadConversation,
} from "../../lib/tauri";
import type { ConversationSummary } from "../../lib/types";
import {
  Home,
  Plus,
  MessageSquare,
  Trash2,
  BarChart3,
  BookOpen,
  Store,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AppSidebar() {
  const { agents, selectedAgent, selectAgent } = useAgentStore();
  const { setView, toggleSettings, currentView } = useAppStore();
  const { clearMessages } = useChatStore();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const convs = await listConversations();
      setConversations(convs);
    } catch {
      setConversations([]);
    }
  };

  const handleNewChat = () => {
    selectAgent(null);
    clearMessages();
    setView("home");
  };

  const handleResumeConversation = async (conv: ConversationSummary) => {
    try {
      const full = await loadConversation(conv.id);
      const agent = agents.find((a) => a.id === conv.agentId);
      if (agent) selectAgent(agent);
      useChatStore.setState((s) => ({
        messagesByAgent: {
          ...s.messagesByAgent,
          [conv.agentId]: full.messages,
        },
        messages: full.messages,
        currentAgentId: conv.agentId,
      }));
      setView("chat");
    } catch {
      // ignore
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteTauriConv(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
    setDeleteConfirm(null);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000)
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const navItems = [
    { view: "home" as const, icon: Home, label: "Home" },
    { view: "analytics" as const, icon: BarChart3, label: "Analytics" },
    { view: "knowledge" as const, icon: BookOpen, label: "Knowledge" },
    { view: "marketplace" as const, icon: Store, label: "Marketplace" },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            N
          </div>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <h1 className="text-sm font-semibold tracking-tight truncate">
              Nativz Agents
            </h1>
            <p className="text-xs text-muted-foreground">AI-powered tools</p>
          </div>
        </div>
      </SidebarHeader>

      <div className="px-3 pb-2 group-data-[collapsible=icon]:px-2">
        <Button
          onClick={handleNewChat}
          variant="outline"
          className="w-full justify-start gap-2"
          size="sm"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span className="group-data-[collapsible=icon]:hidden">New Chat</span>
        </Button>
      </div>

      <SidebarContent>
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ view, icon: Icon, label }) => {
                const isActive = currentView === view;
                return (
                  <SidebarMenuItem key={view}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        if (view === "home") selectAgent(null);
                        setView(view);
                      }}
                      tooltip={label}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Agents */}
        <SidebarGroup>
          <SidebarGroupLabel>Agents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {agents.map((agent) => {
                const isActive =
                  selectedAgent?.id === agent.id && currentView === "chat";
                return (
                  <SidebarMenuItem key={agent.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        selectAgent(agent);
                        setView("chat");
                        clearMessages();
                      }}
                      tooltip={agent.name}
                    >
                      <span className="text-sm shrink-0">{agent.icon}</span>
                      <span className="truncate">{agent.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Recent Conversations */}
        <SidebarGroup>
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="max-h-[240px]">
              <SidebarMenu>
                {conversations.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-2 group-data-[collapsible=icon]:hidden">
                    No conversations yet
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <SidebarMenuItem key={conv.id}>
                      <SidebarMenuButton
                        onClick={() => handleResumeConversation(conv)}
                        tooltip={conv.title}
                        className="group/conv"
                      >
                        <MessageSquare size={14} className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs truncate block">
                            {conv.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {formatTime(conv.updatedAt)}
                          </span>
                        </div>
                        {deleteConfirm === conv.id ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conv.id);
                            }}
                            className="text-[9px] text-destructive font-medium px-1.5 py-0.5 rounded bg-destructive/10"
                          >
                            delete?
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(conv.id);
                            }}
                            className="p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover/conv:opacity-100 transition-all"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleSettings} tooltip="Settings">
              <Settings size={16} />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
