import { useEffect, useRef } from "react";
import { useAgentStore } from "../../stores/agentStore";
import { useChatStore } from "../../stores/chatStore";
import { useModelStore } from "../../stores/modelStore";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import EmptyState from "./EmptyState";
import ThinkingIndicator from "./ThinkingIndicator";
import { Loader2 } from "lucide-react";

export default function ChatView() {
  const { selectedAgent } = useAgentStore();
  const { messages, isStreaming, sendMessage, setAgent } = useChatStore();
  const { refreshProviders } = useModelStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedAgent) {
      setAgent(selectedAgent.id);
      refreshProviders(selectedAgent.id);
    }
  }, [selectedAgent?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (!selectedAgent) return null;

  const handleSend = (content: string) => {
    sendMessage(selectedAgent.id, content);
  };

  const lastMsg = messages[messages.length - 1];
  const isLastStreaming =
    isStreaming && lastMsg?.role === "assistant" && lastMsg.content === "";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onSelectPrompt={handleSend} />
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-6">
            <div className="space-y-1">
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
            {isLastStreaming && (
              <ThinkingIndicator
                steps={[
                  {
                    id: "1",
                    type: "thinking",
                    label: "Processing your request...",
                    status: "active",
                    timestamp: Date.now(),
                  },
                ]}
                isActive={true}
              />
            )}
            {isStreaming &&
              lastMsg?.role === "assistant" &&
              lastMsg.content !== "" && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs mt-3 ml-1">
                  <Loader2 size={12} className="animate-spin" />
                  <span>typing...</span>
                </div>
              )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <InputBar onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
