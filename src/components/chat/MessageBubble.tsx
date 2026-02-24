import type { Message } from '../../lib/types';
import ReactMarkdown from 'react-markdown';
import ToolStatus from './ToolStatus';
import ArtifactRenderer from './ArtifactRenderer';

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`max-w-[80%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`px-4 py-3 text-[13px] leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white rounded-2xl rounded-br-md shadow-sm shadow-blue-600/10'
              : isSystem
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl rounded-bl-md'
              : 'bg-zinc-800/50 text-zinc-200 rounded-2xl rounded-bl-md border border-zinc-800/30'
          }`}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_li]:text-zinc-300">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && !isSystem && message.content && (
          <ArtifactRenderer text={message.content} />
        )}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolCalls.map((tc, i) => (
              <ToolStatus key={i} tool={tc} />
            ))}
          </div>
        )}
        <p className={`text-[10px] text-zinc-600 mt-1.5 px-1 ${isUser ? 'text-right' : ''}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
