import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface AgentManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  model: { primary: string; fast: string };
  systemPrompt: string;
  knowledge: string[];
  skills: string[];
  mcpServers: Array<{ name: string; command: string; args?: string[]; env?: Record<string, string> }>;
  guardrails: {
    maxTokensPerTurn: number;
    allowedDomains: string[];
  };
}

export async function loadManifest(manifestPath: string): Promise<AgentManifest> {
  const content = await fs.readFile(manifestPath, "utf-8");
  return JSON.parse(content) as AgentManifest;
}

export async function listAgents(agentsDir: string): Promise<AgentManifest[]> {
  const manifests: AgentManifest[] = [];
  let entries: string[];
  try {
    entries = await fs.readdir(agentsDir);
  } catch {
    return manifests;
  }
  for (const entry of entries) {
    const manifestPath = path.join(agentsDir, entry, "manifest.json");
    try {
      manifests.push(await loadManifest(manifestPath));
    } catch {
      // Skip invalid manifests
    }
  }
  return manifests;
}
