/**
 * Import system — knowledge files, agent configs, conversations, client data.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import type { AgentManifest } from "../agent/loader.js";
import type { AgentConfigExport } from "./export.js";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ImportResult {
  success: boolean;
  itemsImported: number;
  errors: string[];
}

export interface ImportedConversation {
  id: string;
  agentId: string;
  title: string;
  messages: Array<{ role: string; content: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRecord {
  id?: string;
  name: string;
  [key: string]: unknown;
}

// ── Knowledge File Import ──────────────────────────────────────────────────

const SUPPORTED_KNOWLEDGE_EXTS = new Set([".txt", ".md", ".pdf", ".csv", ".json", ".html"]);

export async function importKnowledgeFiles(
  filePaths: string[],
  knowledgeDir: string,
): Promise<ImportResult> {
  fs.mkdirSync(knowledgeDir, { recursive: true });
  const errors: string[] = [];
  let imported = 0;

  for (const fp of filePaths) {
    const ext = path.extname(fp).toLowerCase();
    if (!SUPPORTED_KNOWLEDGE_EXTS.has(ext)) {
      errors.push(`Unsupported file type: ${path.basename(fp)}`);
      continue;
    }
    try {
      const dest = path.join(knowledgeDir, path.basename(fp));
      fs.copyFileSync(fp, dest);
      imported++;
    } catch (err) {
      errors.push(`Failed to import ${path.basename(fp)}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { success: errors.length === 0, itemsImported: imported, errors };
}

// ── Agent Config Import ────────────────────────────────────────────────────

export async function importAgentConfig(
  configPath: string,
  agentsDir: string,
): Promise<ImportResult & { manifest?: AgentManifest }> {
  try {
    const content = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(content) as AgentConfigExport;

    if (!parsed.manifest || !parsed.manifest.id) {
      return { success: false, itemsImported: 0, errors: ["Invalid agent config: missing manifest or id"] };
    }

    const agentDir = path.join(agentsDir, parsed.manifest.id);
    fs.mkdirSync(agentDir, { recursive: true });
    const manifestPath = path.join(agentDir, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(parsed.manifest, null, 2), "utf-8");

    return { success: true, itemsImported: 1, errors: [], manifest: parsed.manifest };
  } catch (err) {
    return { success: false, itemsImported: 0, errors: [err instanceof Error ? err.message : String(err)] };
  }
}

// ── Conversation History Import ────────────────────────────────────────────

export async function importConversations(
  filePath: string,
): Promise<ImportResult & { conversations: ImportedConversation[] }> {
  const conversations: ImportedConversation[] = [];
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content) as unknown;

    const items = Array.isArray(parsed) ? parsed : [parsed];

    for (const item of items) {
      const conv = item as Record<string, unknown>;
      if (!conv.messages || !Array.isArray(conv.messages)) {
        continue;
      }
      conversations.push({
        id: (conv.id as string) || randomUUID(),
        agentId: (conv.agentId as string) || "diy",
        title: (conv.title as string) || "Imported Conversation",
        messages: (conv.messages as Array<{ role: string; content: string }>).map((m) => ({
          role: String(m.role ?? "user"),
          content: String(m.content ?? ""),
        })),
        createdAt: (conv.createdAt as string) || new Date().toISOString(),
        updatedAt: (conv.updatedAt as string) || new Date().toISOString(),
      });
    }

    return { success: true, itemsImported: conversations.length, errors: [], conversations };
  } catch (err) {
    return {
      success: false,
      itemsImported: 0,
      errors: [err instanceof Error ? err.message : String(err)],
      conversations: [],
    };
  }
}

// ── Client Data Import (CSV/JSON) ─────────────────────────────────────────

function parseCSV(content: string): ClientRecord[] {
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const records: ClientRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const record: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j] ?? "";
    }
    if (!record.name) record.name = `Record ${i}`;
    records.push(record as ClientRecord);
  }
  return records;
}

export async function importClientData(
  filePath: string,
): Promise<ImportResult & { records: ClientRecord[] }> {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const ext = path.extname(filePath).toLowerCase();
    let records: ClientRecord[];

    if (ext === ".csv") {
      records = parseCSV(content);
    } else if (ext === ".json") {
      const parsed = JSON.parse(content) as unknown;
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      records = arr.map((item, idx) => {
        const r = item as Record<string, unknown>;
        if (!r.name) r.name = `Record ${idx + 1}`;
        return r as ClientRecord;
      });
    } else {
      return { success: false, itemsImported: 0, errors: [`Unsupported format: ${ext}`], records: [] };
    }

    return { success: true, itemsImported: records.length, errors: [], records };
  } catch (err) {
    return {
      success: false,
      itemsImported: 0,
      errors: [err instanceof Error ? err.message : String(err)],
      records: [],
    };
  }
}
