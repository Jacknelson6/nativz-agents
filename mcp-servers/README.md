# MCP Server Configurations

Pre-configured [Model Context Protocol](https://modelcontextprotocol.io/) servers for Nativz Agents. These are referenced in each agent's `manifest.json` but need to be installed before use.

## Quick Start

MCP servers run as local processes that agents connect to via stdio. Install them with `npx` (no global install needed) — the agent runtime handles spawning automatically.

## Recommended Servers by Agent

### SEO Agent
| Server | Package | Purpose |
|--------|---------|---------|
| filesystem | `@modelcontextprotocol/server-filesystem` | Read/write local files (reports, configs, sitemaps) |
| fetch | `@anthropic/mcp-server-fetch` | Fetch and parse web pages for audits |
| search-console | `search-console-mcp` | Google Search Console data (requires GSC auth) |

### Ads Agent
| Server | Package | Purpose |
|--------|---------|---------|
| filesystem | `@modelcontextprotocol/server-filesystem` | Read/write budget spreadsheets, reports |
| google-sheets | `@anthropic/mcp-server-google-sheets` | Direct Google Sheets access for budget tracking |

### Content Editor Agent
| Server | Package | Purpose |
|--------|---------|---------|
| filesystem | `@modelcontextprotocol/server-filesystem` | Read/write content drafts, style guides |

### Account Manager Agent
| Server | Package | Purpose |
|--------|---------|---------|
| filesystem | `@modelcontextprotocol/server-filesystem` | Read/write client reports, SOWs |

### DIY Agent
| Server | Package | Purpose |
|--------|---------|---------|
| filesystem | `@modelcontextprotocol/server-filesystem` | General file access |
| memory | `@modelcontextprotocol/server-memory` | Persistent key-value memory across sessions |
| fetch | `@anthropic/mcp-server-fetch` | Fetch any URL |

### All Agents (Optional)
| Server | Package | Purpose |
|--------|---------|---------|
| fetch | `@anthropic/mcp-server-fetch` | Fetch and extract content from any URL |
| memory | `@modelcontextprotocol/server-memory` | Persistent memory across conversations |

## Installation & Setup

### Filesystem Server
```bash
# No install needed — runs via npx
npx -y @modelcontextprotocol/server-filesystem ./

# Restrict to specific directories:
npx -y @modelcontextprotocol/server-filesystem ./reports ./data
```

### Fetch Server
```bash
npx -y @anthropic/mcp-server-fetch
```

### Memory Server
```bash
npx -y @modelcontextprotocol/server-memory
```

### Search Console MCP
```bash
npm install -g search-console-mcp

# Requires Google OAuth credentials:
export GOOGLE_CLIENT_ID=your_client_id
export GOOGLE_CLIENT_SECRET=your_client_secret
search-console-mcp
```

## Adding a New MCP Server

1. Add the server config to the agent's `manifest.json`:
```json
{
  "mcpServers": [
    {
      "name": "your-server",
      "command": "npx",
      "args": ["-y", "@scope/server-package"]
    }
  ]
}
```

2. The agent runtime will spawn the server process and connect via stdio when the agent starts.

3. Environment variables can be passed via an optional `env` field:
```json
{
  "name": "your-server",
  "command": "npx",
  "args": ["-y", "@scope/server-package"],
  "env": {
    "API_KEY": "your-key"
  }
}
```
