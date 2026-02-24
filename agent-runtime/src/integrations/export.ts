/**
 * Export system — conversations, artifacts, agent configs in multiple formats.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { ConversationStore, type Conversation } from "../memory/conversations.js";
import type { AgentManifest } from "../agent/loader.js";

// ── Types ──────────────────────────────────────────────────────────────────

export type ExportFormat = "markdown" | "json" | "csv" | "pdf";

export interface ExportOptions {
  format: ExportFormat;
  outputDir: string;
  includeMetadata?: boolean;
  includeToolCalls?: boolean;
}

export interface ExportResult {
  filePath: string;
  format: ExportFormat;
  sizeBytes: number;
}

// ── Conversation Export ────────────────────────────────────────────────────

function conversationToMarkdown(conv: Conversation, includeMetadata = true): string {
  const lines: string[] = [];
  lines.push(`# ${conv.title}`);
  if (includeMetadata) {
    lines.push("");
    lines.push(`- **Agent:** ${conv.agentId}`);
    lines.push(`- **Created:** ${conv.createdAt}`);
    lines.push(`- **Updated:** ${conv.updatedAt}`);
  }
  lines.push("");

  for (const msg of conv.messages) {
    const label = msg.role === "user" ? "**User**" : "**Assistant**";
    lines.push(`### ${label}`);
    lines.push("");
    lines.push(msg.content);
    lines.push("");
  }
  return lines.join("\n");
}

function conversationToCSV(conv: Conversation): string {
  const rows: string[] = ["role,content,timestamp"];
  for (const msg of conv.messages) {
    const escaped = msg.content.replace(/"/g, '""').replace(/\n/g, "\\n");
    rows.push(`"${msg.role}","${escaped}","${conv.updatedAt}"`);
  }
  return rows.join("\n");
}

function conversationToHTMLForPDF(conv: Conversation): string {
  const msgs = conv.messages
    .map((m) => {
      const cls = m.role === "user" ? "user" : "assistant";
      const escaped = m.content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
      return `<div class="msg ${cls}"><strong>${m.role}:</strong><p>${escaped}</p></div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${conv.title}</title>
<style>
body{font-family:system-ui;max-width:800px;margin:0 auto;padding:20px;background:#111;color:#eee}
.msg{margin:12px 0;padding:12px;border-radius:8px}
.user{background:#1a3a5c}.assistant{background:#1a1a2e}
strong{color:#7dd3fc}
</style></head><body>
<h1>${conv.title}</h1>
<p>Agent: ${conv.agentId} | ${conv.createdAt}</p>
${msgs}
</body></html>`;
}

export async function exportConversation(conv: Conversation, options: ExportOptions): Promise<ExportResult> {
  fs.mkdirSync(options.outputDir, { recursive: true });
  const safeName = conv.title.replace(/[^a-zA-Z0-9-_ ]/g, "").slice(0, 80) || conv.id;

  let content: string;
  let ext: string;

  switch (options.format) {
    case "markdown":
      content = conversationToMarkdown(conv, options.includeMetadata);
      ext = "md";
      break;
    case "json":
      content = JSON.stringify(conv, null, 2);
      ext = "json";
      break;
    case "csv":
      content = conversationToCSV(conv);
      ext = "csv";
      break;
    case "pdf":
      // Write as HTML (can be opened in browser → Print to PDF)
      content = conversationToHTMLForPDF(conv);
      ext = "html";
      break;
    default:
      throw new Error(`Unsupported format: ${options.format as string}`);
  }

  const filePath = path.join(options.outputDir, `${safeName}.${ext}`);
  fs.writeFileSync(filePath, content, "utf-8");
  const stat = fs.statSync(filePath);
  return { filePath, format: options.format, sizeBytes: stat.size };
}

// ── Batch Export ───────────────────────────────────────────────────────────

export async function batchExportConversations(
  store: ConversationStore,
  agentId: string,
  options: ExportOptions,
): Promise<ExportResult[]> {
  const convos = store.list(agentId);
  const results: ExportResult[] = [];
  for (const conv of convos) {
    results.push(await exportConversation(conv, options));
  }
  return results;
}

// ── Agent Config Export (backup) ───────────────────────────────────────────

export interface AgentConfigExport {
  version: 1;
  exportedAt: string;
  manifest: AgentManifest;
}

export async function exportAgentConfig(manifest: AgentManifest, outputDir: string): Promise<ExportResult> {
  fs.mkdirSync(outputDir, { recursive: true });
  const payload: AgentConfigExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    manifest,
  };
  const filePath = path.join(outputDir, `${manifest.id}-config.json`);
  const content = JSON.stringify(payload, null, 2);
  fs.writeFileSync(filePath, content, "utf-8");
  const stat = fs.statSync(filePath);
  return { filePath, format: "json", sizeBytes: stat.size };
}

// ── Artifact Export ────────────────────────────────────────────────────────

export interface ArtifactExportItem {
  id: string;
  type: string;
  title: string;
  content: string;
}

export async function exportArtifacts(artifacts: ArtifactExportItem[], outputDir: string): Promise<ExportResult> {
  fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, "artifacts.json");
  const content = JSON.stringify({ exportedAt: new Date().toISOString(), artifacts }, null, 2);
  fs.writeFileSync(filePath, content, "utf-8");
  const stat = fs.statSync(filePath);
  return { filePath, format: "json", sizeBytes: stat.size };
}
