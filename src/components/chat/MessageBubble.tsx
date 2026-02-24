import type { Message } from "../../lib/types";
import ReactMarkdown from "react-markdown";
import ToolStatus from "./ToolStatus";
import ArtifactRenderer from "./ArtifactRenderer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} mb-4 group`}
    >
      {!isUser && !isSystem && (
        <Avatar className="h-7 w-7 shrink-0 mt-1">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            <Bot size={14} />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[80%] ${isUser ? "order-1" : ""}`}>
        <div
          className={`px-4 py-3 text-[13px] leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
              : isSystem
                ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl rounded-bl-md"
                : "bg-muted text-foreground rounded-2xl rounded-bl-md"
          }`}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0">
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
        <p
          className={`text-[10px] text-muted-foreground mt-1.5 px-1 ${isUser ? "text-right" : ""}`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
