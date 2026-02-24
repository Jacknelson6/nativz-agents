import { useEffect, useRef } from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { useChatStore } from '../../stores/chatStore';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import ThinkingIndicator from './ThinkingIndicator';
import { Loader2 } from 'lucide-react';

export default function ChatView() {
  const { selectedAgent } = useAgentStore();
  const { messages, isStreaming, sendMessage, setAgent } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedAgent) setAgent(selectedAgent.id);
  }, [selectedAgent?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (!selectedAgent) return null;

  const handleSend = (content: string) => {
    sendMessage(selectedAgent.id, content);
  };

  // Check if the last assistant message is still streaming (empty content)
  const lastMsg = messages[messages.length - 1];
  const isLastStreaming = isStreaming && lastMsg?.role === 'assistant' && lastMsg.content === '';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">{selectedAgent.icon}</div>
            <h2 className="text-lg font-semibold mb-1">{selectedAgent.name}</h2>
            <p className="text-sm text-muted max-w-md">{selectedAgent.description}</p>
          </div>
        )}
        <div className="max-w-3xl mx-auto">
          {messages.map((msg, i) => {
            // Skip the empty streaming placeholder — show ThinkingIndicator instead
            if (isStreaming && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '') {
              return null;
            }
            return <MessageBubble key={msg.id} message={msg} />;
          })}
          {isLastStreaming && (
            <ThinkingIndicator
              steps={[{ id: '1', type: 'thinking', label: 'Processing your request...', status: 'active', timestamp: Date.now() }]}
              isActive={true}
            />
          )}
          {isStreaming && lastMsg?.role === 'assistant' && lastMsg.content !== '' && (
            <div className="flex items-center gap-2 text-muted text-sm mb-4">
              <Loader2 size={14} className="animate-spin" />
              <span>Streaming...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <InputBar onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
