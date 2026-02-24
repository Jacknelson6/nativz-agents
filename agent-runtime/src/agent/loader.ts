import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface ProviderManifestConfig {
  provider: string;
  models: {
    primary: string;
    fast: string;
    embedding?: string;
  };
  priority: number;
  isSubscription?: boolean;
}

export interface MemoryManifestConfig {
  workingMemorySize?: number;
  extractFacts?: boolean;
  entityTypes?: string[];
}

export interface ContextManifestConfig {
  maxTokens?: number;
  budgetAllocation?: {
    system?: number;
    workingMemory?: number;
    knowledge?: number;
    history?: number;
    tools?: number;
  };
}

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
  // v2 fields
  providers?: ProviderManifestConfig[];
  memory?: MemoryManifestConfig;
  context?: ContextManifestConfig;
}

interface RawManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  model?: { primary: string; fast: string };
  systemPrompt: string;
  knowledge: string[];
  skills: string[];
  mcpServers: Array<{ name: string; command: string; args?: string[]; env?: Record<string, string> }>;
  guardrails: {
    maxTokensPerTurn: number;
    allowedDomains: string[];
  };
  providers?: ProviderManifestConfig[];
  memory?: MemoryManifestConfig;
  context?: ContextManifestConfig;
}

export async function loadManifest(manifestPath: string): Promise<AgentManifest> {
  const content = await fs.readFile(manifestPath, "utf-8");
  const raw = JSON.parse(content) as RawManifest;

  // Derive model config from providers[] if model field is absent (v2 schema)
  let model = raw.model;
  if (!model && raw.providers && raw.providers.length > 0) {
    // Sort by priority, pick the first
    const sorted = [...raw.providers].sort((a, b) => a.priority - b.priority);
    model = {
      primary: sorted[0].models.primary,
      fast: sorted[0].models.fast,
    };
  }
  if (!model) {
    model = { primary: "claude-sonnet-4-20250514", fast: "claude-haiku-4-5-20241022" };
  }

  return {
    id: raw.id,
    name: raw.name,
    version: raw.version,
    description: raw.description,
    icon: raw.icon,
    model,
    systemPrompt: raw.systemPrompt,
    knowledge: raw.knowledge,
    skills: raw.skills,
    mcpServers: raw.mcpServers,
    guardrails: raw.guardrails,
    providers: raw.providers,
    memory: raw.memory,
    context: raw.context,
  };
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
