import { useEffect, useRef, useState, useCallback } from "react";
import { useAgentStore } from "../../stores/agentStore";
import { useChatStore } from "../../stores/chatStore";
import { useModelStore } from "../../stores/modelStore";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import EmptyState from "./EmptyState";
import ThinkingIndicator from "./ThinkingIndicator";
import { ArrowDown, Download, Loader2 } from "lucide-react";
import { exportToMarkdown } from "../../lib/export";
import { Button } from "@/components/ui/button";

export default function ChatView() {
  const { selectedAgent } = useAgentStore();
  const { messages, isStreaming, sendMessage, setAgent, thinkingSteps } = useChatStore();
  const { refreshProviders } = useModelStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    if (selectedAgent) {
      setAgent(selectedAgent.id);
      refreshProviders(selectedAgent.id);
    }
  }, [selectedAgent?.id, setAgent, refreshProviders]);

  // Auto-scroll to bottom on new messages (only if already near bottom)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    // Auto-scroll if user is within 150px of bottom
    if (distanceFromBottom < 150) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  // Track scroll position for scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBtn(distanceFromBottom > 200);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (!selectedAgent) return null;

  const handleSend = (content: string) => {
    sendMessage(selectedAgent.id, content);
  };

  const handleExport = async () => {
    if (messages.length === 0) return;
    const markdown = exportToMarkdown(messages);
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      // ignore
    }
  };

  const lastMsg = messages[messages.length - 1];
  const isLastStreaming =
    isStreaming && lastMsg?.role === "assistant" && lastMsg.content === "";

  return (
    <div className="flex flex-col h-full">
      {messages.length > 0 && (
        <div className="flex items-center justify-between px-6 py-2 border-b border-border/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{selectedAgent?.name}</span>
            <span className="text-muted-foreground/40">&middot;</span>
            <span className="text-xs">{messages.length} messages</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="h-7 text-xs gap-1.5"
          >
            <Download size={12} />
            Export
          </Button>
        </div>
      )}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <EmptyState onSelectPrompt={handleSend} />
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-6">
            <div className="space-y-3">
              {messages.map((msg, i) => {
                if (
                  isStreaming &&
                  i === messages.length - 1 &&
                  msg.role === "assistant" &&
                  msg.content === ""
                ) {
                  return null;
                }
                return <MessageBubble key={msg.id} message={msg} />;
              })}
            </div>
            {isStreaming && thinkingSteps.length > 0 && (
              <ThinkingIndicator
                steps={thinkingSteps}
                isActive={isStreaming}
              />
            )}
            {isLastStreaming && thinkingSteps.length === 0 && (
              <ThinkingIndicator
                steps={[{
                  id: "default",
                  type: "thinking",
                  label: "Processing your request...",
                  status: "active",
                  timestamp: Date.now(),
                }]}
                isActive={true}
              />
            )}
            {isStreaming &&
              lastMsg?.role === "assistant" &&
              lastMsg.content !== "" && (
                <div className="flex items-center gap-2 text-muted-foreground/60 text-xs mt-3 ml-10">
                  <Loader2 size={11} className="animate-spin" />
                  <span className="text-[11px]">Generating response...</span>
                </div>
              )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Scroll to bottom button */}
        {showScrollBtn && messages.length > 0 && (
          <div className="sticky bottom-4 flex justify-center pointer-events-none">
            <Button
              variant="secondary"
              size="sm"
              onClick={scrollToBottom}
              className="pointer-events-auto shadow-lg gap-1.5 rounded-full px-4 h-8 text-xs"
            >
              <ArrowDown size={12} />
              Scroll to bottom
            </Button>
          </div>
        )}
      </div>
      <InputBar onSend={handleSend} disabled={isStreaming} agentId={selectedAgent?.id} />
    </div>
  );
}
