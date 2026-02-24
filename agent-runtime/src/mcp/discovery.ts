import type { McpServerConfig } from "./client.js";

export interface McpServerInfo {
  name: string;
  description: string;
  package: string;
  argsTemplate: string[];
  defaultEnv?: Record<string, string>;
}

export interface AgentManifestMcp {
  servers?: Record<string, McpServerConfig>;
}

const POPULAR_SERVERS: McpServerInfo[] = [
  {
    name: "filesystem",
    description: "Read, write, and manage local files",
    package: "@modelcontextprotocol/server-filesystem",
    argsTemplate: ["/path/to/allowed/dir"],
  },
  {
    name: "fetch",
    description: "Fetch web pages and convert to markdown/text",
    package: "@anthropic-ai/mcp-server-fetch",
    argsTemplate: [],
  },
  {
    name: "github",
    description: "GitHub API integration — repos, issues, PRs",
    package: "@modelcontextprotocol/server-github",
    argsTemplate: [],
    defaultEnv: { GITHUB_PERSONAL_ACCESS_TOKEN: "" },
  },
  {
    name: "memory",
    description: "Persistent memory using a knowledge graph",
    package: "@modelcontextprotocol/server-memory",
    argsTemplate: [],
  },
  {
    name: "sequential-thinking",
    description: "Step-by-step reasoning and problem solving",
    package: "@modelcontextprotocol/server-sequential-thinking",
    argsTemplate: [],
  },
  {
    name: "brave-search",
    description: "Web search via Brave Search API",
    package: "@modelcontextprotocol/server-brave-search",
    argsTemplate: [],
    defaultEnv: { BRAVE_API_KEY: "" },
  },
  {
    name: "playwright",
    description: "Browser automation via Playwright",
    package: "@executeautomation/playwright-mcp-server",
    argsTemplate: [],
  },
  {
    name: "puppeteer",
    description: "Browser automation via Puppeteer",
    package: "@modelcontextprotocol/server-puppeteer",
    argsTemplate: [],
  },
  {
    name: "sqlite",
    description: "Query and manage SQLite databases",
    package: "@modelcontextprotocol/server-sqlite",
    argsTemplate: ["/path/to/database.db"],
  },
  {
    name: "postgres",
    description: "Query PostgreSQL databases",
    package: "@modelcontextprotocol/server-postgres",
    argsTemplate: [],
    defaultEnv: { POSTGRES_CONNECTION_STRING: "" },
  },
  {
    name: "slack",
    description: "Slack workspace integration",
    package: "@modelcontextprotocol/server-slack",
    argsTemplate: [],
    defaultEnv: { SLACK_BOT_TOKEN: "" },
  },
  {
    name: "google-drive",
    description: "Google Drive file access and search",
    package: "@modelcontextprotocol/server-google-drive",
    argsTemplate: [],
  },
];

export class McpDiscovery {
  loadFromManifest(manifest: AgentManifestMcp): Map<string, McpServerConfig> {
    const configs = new Map<string, McpServerConfig>();
    if (manifest.servers) {
      for (const [name, config] of Object.entries(manifest.servers)) {
        configs.set(name, config);
      }
    }
    return configs;
  }

  listAvailableServers(): McpServerInfo[] {
    return [...POPULAR_SERVERS];
  }

  getServerInfo(name: string): McpServerInfo | undefined {
    return POPULAR_SERVERS.find((s) => s.name === name);
  }

  buildConfig(info: McpServerInfo, args?: string[], env?: Record<string, string>): McpServerConfig {
    return {
      command: "npx",
      args: ["-y", info.package, ...(args ?? info.argsTemplate)],
      env: { ...info.defaultEnv, ...env },
    };
  }
}
