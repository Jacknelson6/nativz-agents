import { useState, useCallback } from "react";
import type { Message } from "../../lib/types";
import ReactMarkdown from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import ToolStatus from "./ToolStatus";
import ArtifactRenderer from "./ArtifactRenderer";
import MessageActions from "./MessageActions";
import ReportViewer from "./ReportViewer";
import { useChatStore } from "../../stores/chatStore";
import { useAgentStore } from "../../stores/agentStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Copy, Check, Bookmark, RotateCcw } from "lucide-react";
import type { ToolCall } from "../../lib/types";

// Register only the languages we need
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts", typescript);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("sh", bash);
SyntaxHighlighter.registerLanguage("shell", bash);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("html", markup);
SyntaxHighlighter.registerLanguage("xml", markup);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("py", python);
SyntaxHighlighter.registerLanguage("yaml", yaml);
SyntaxHighlighter.registerLanguage("yml", yaml);
SyntaxHighlighter.registerLanguage("markdown", markdown);
SyntaxHighlighter.registerLanguage("md", markdown);
SyntaxHighlighter.registerLanguage("sql", sql);

function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* clipboard not available */ });
  }, [code]);

  if (!match) {
    return (
      <code className="bg-background/50 px-1.5 py-0.5 rounded text-[12px] font-mono">
        {children}
      </code>
    );
  }

  return (
    <div className="relative group/code my-3 -mx-1">
      <div className="flex items-center justify-between bg-background/80 px-3 py-1.5 rounded-t-lg border border-b-0 border-border/50">
        <span className="text-[10px] text-muted-foreground font-mono uppercase">{lang}</span>
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
          title="Copy code"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={lang}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: "0.5rem",
          borderBottomRightRadius: "0.5rem",
          fontSize: "12px",
          border: "1px solid hsl(var(--border) / 0.5)",
          borderTop: "none",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function detectReport(toolCall: ToolCall): { filename: string; content: string } | null {
  if (!toolCall.output || toolCall.status !== 'completed') return null;
  if (toolCall.name !== 'file-write' && toolCall.name !== 'file_write') return null;

  // Check if the output looks like a report (has markdown headers)
  const output = toolCall.output;
  if (output.includes('# ') && output.length > 500) {
    const firstLine = output.split('\n')[0];
    const filename = firstLine.startsWith('# ') ? firstLine.slice(2).trim().replace(/\s+/g, '-').toLowerCase() : 'report';
    return { filename: `${filename}.md`, content: output };
  }

  return null;
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const { toggleBookmark, isBookmarked } = useChatStore();
  const bookmarked = isBookmarked(message.id);
  const isError = isSystem && message.content.startsWith("Error:");

  const handleRetry = () => {
    const state = useChatStore.getState();
    const agentId = useAgentStore.getState().selectedAgent?.id;
    if (!agentId) return;
    const msgs = state.messages;
    // Find the previous user message
    const idx = msgs.findIndex((m) => m.id === message.id);
    for (let i = idx - 1; i >= 0; i--) {
      if (msgs[i].role === "user") {
        state.sendMessage(agentId, msgs[i].content);
        return;
      }
    }
  };

  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} mb-5 group`}
    >
      {!isUser && !isSystem && (
        <Avatar className="h-7 w-7 shrink-0 mt-1">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            <Bot size={14} />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[80%] min-w-0 ${isUser ? "order-1" : ""}`}>
        <div
          className={`px-4 py-3 text-[13px] leading-relaxed overflow-hidden ${
            bookmarked ? "border-l-2 border-l-primary pl-3 " : ""
          }${
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm"
              : isSystem
                ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl rounded-bl-md"
                : "bg-muted/80 text-foreground rounded-2xl rounded-bl-md"
          }`}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none [&_p]:mb-2.5 [&_p:last-child]:mb-0 [&_ul]:mb-2.5 [&_ol]:mb-2.5 [&_li]:mb-1 [&_h1]:mb-3 [&_h2]:mb-2.5 [&_h3]:mb-2 [&_h1]:mt-4 [&_h2]:mt-3.5 [&_h3]:mt-3">
              <ReactMarkdown
                components={{
                  code({ className, children }) {
                    return <CodeBlock className={className}>{children}</CodeBlock>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {isError && (
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 mt-2 px-3 py-1.5 text-[11px] font-medium text-destructive hover:text-destructive/80 bg-destructive/10 hover:bg-destructive/15 border border-destructive/20 rounded-lg transition-colors"
          >
            <RotateCcw size={12} />
            Retry
          </button>
        )}
        {!isUser && !isSystem && message.content && (
          <ArtifactRenderer text={message.content} />
        )}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            {message.toolCalls.map((tc, i) => (
              <ToolStatus key={i} tool={tc} autoExpand={i === message.toolCalls!.length - 1} />
            ))}
          </div>
        )}
        {message.toolCalls?.map((tc) => {
          const report = detectReport(tc);
          if (report) {
            return <ReportViewer key={`report-${tc.toolUseId ?? tc.name}`} filename={report.filename} content={report.content} />;
          }
          return null;
        }).filter(Boolean)}
        <div className={`flex items-center gap-2 mt-2 px-1 ${isUser ? "justify-end" : ""}`}>
          <p className="text-[10px] text-muted-foreground/60">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {!isSystem && message.content && (
            <>
              <button
                onClick={() => toggleBookmark(message.id)}
                className={`p-1 rounded transition-colors ${
                  bookmarked
                    ? 'text-primary'
                    : 'text-muted-foreground/40 hover:text-primary opacity-0 group-hover:opacity-100'
                }`}
                title={bookmarked ? 'Remove bookmark' : 'Bookmark message'}
              >
                <Bookmark size={12} fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
              <MessageActions message={message} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
