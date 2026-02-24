# Nativz Agents — Architecture

> Pre-built AI agents for social media teams. Download, pick an agent, start working.

## Vision

A Tauri desktop app where team members install once, pick a specialized agent (SEO, Ads, Content, etc.), and get expert-level AI that works day one. No prompt engineering. No training. Each agent ships with curated knowledge, tools, and masterfully engineered context.

## Stack

| Layer | Tech | Why |
|-------|------|-----|
| Desktop Shell | Tauri v2 (Rust) | Native, lightweight, system access, auto-updater |
| Frontend | React + TypeScript + Tailwind | Familiar, fast iteration |
| Agent Runtime | Node.js sidecar | Claude SDK, Playwright, npm ecosystem |
| LLM | Anthropic Claude (Opus + Haiku) | Best for complex reasoning + tool use |
| Tools/Skills | MCP Protocol + built-in skills | Standard protocol, massive ecosystem |
| Browser | Stagehand + Playwright | AI-powered web automation |
| Knowledge | LanceDB + local embeddings | Fast local vector search, no server |
| Memory | SQLite (better-sqlite3) | Persistent, local, fast |
| Context Engineering | muratcankoylan/Agent-Skills-for-Context-Engineering | Proven context management patterns |

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     TAURI SHELL                          │
│                                                          │
│  ┌──────────────────┐  IPC  ┌──────────────────────────┐│
│  │   RUST BACKEND    │◄────►│     REACT FRONTEND       ││
│  │                   │      │                          ││
│  │ • Keychain (keys) │      │ • Agent Picker           ││
│  │ • File system     │      │ • Chat Interface         ││
│  │ • Process mgmt    │      │ • Onboarding             ││
│  │ • SQLite          │      │ • Settings               ││
│  │ • Auto-updater    │      │ • Artifact Viewer        ││
│  └────────┬──────────┘      └──────────────────────────┘│
│           │ stdio JSON-RPC                               │
│  ┌────────▼──────────────────────────────────────────────┐│
│  │            NODE.JS AGENT RUNTIME (sidecar)            ││
│  │                                                        ││
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────────┐ ││
│  │  │ Claude  │ │  Agent   │ │ Skills │ │ MCP Client │ ││
│  │  │  SDK    │ │  Loop    │ │Registry│ │            │ ││
│  │  └─────────┘ └──────────┘ └────────┘ └────────────┘ ││
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────────┐ ││
│  │  │LanceDB  │ │Playwright│ │ Memory │ │ Knowledge  │ ││
│  │  │(vectors)│ │(browser) │ │(SQLite)│ │ (chunks)   │ ││
│  │  └─────────┘ └──────────┘ └────────┘ └────────────┘ ││
│  └────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

## Agent Package Format

Each agent is a directory with:
```
agents/seo/
├── manifest.json    # Agent definition
├── knowledge/       # Curated expertise (markdown files)
│   ├── technical-seo.md
│   ├── on-page-optimization.md
│   └── link-building.md
└── skills/          # Agent-specific skill configs
```

manifest.json:
```json
{
  "id": "seo",
  "name": "SEO Agent",
  "version": "1.0.0",
  "description": "Technical SEO audits, content optimization, and search strategy",
  "icon": "🔍",
  "category": "marketing",
  "model": {
    "primary": "claude-opus-4",
    "fast": "claude-haiku-4-5"
  },
  "systemPrompt": "...",
  "knowledge": ["knowledge/"],
  "skills": ["web-crawl", "screenshot", "http-request", "file-write", "web-search"],
  "mcpServers": [],
  "roles": ["admin", "developer"],
  "guardrails": {
    "maxTokensPerTurn": 8000,
    "allowedDomains": ["*"]
  }
}
```

## Skill System

Skills are tools agents can use. Three sources:

1. **Built-in skills** — file-read, file-write, http-request, web-search, web-crawl, screenshot
2. **MCP servers** — any MCP-compatible server provides tools automatically
3. **Agent-specific skills** — custom skills bundled with an agent package

Skills auto-convert to Claude tool_use format via Zod → JSON Schema.

## MCP Integration

The agent runtime includes an MCP client (TypeScript SDK). Agent manifests can declare MCP servers:

```json
"mcpServers": [
  { "name": "search-console", "command": "npx", "args": ["search-console-mcp"] },
  { "name": "filesystem", "command": "npx", "args": ["@modelcontextprotocol/server-filesystem", "/path"] }
]
```

MCP tools are merged into the skill registry automatically. This means any MCP server in the ecosystem instantly becomes available to agents.

## Knowledge System

Each agent bundles curated knowledge as markdown files. On first load:
1. Read markdown files from agent's knowledge/ directory
2. Chunk (1000 chars, 200 overlap)
3. Prepend document context to each chunk (Contextual Retrieval pattern)
4. Embed locally using all-MiniLM-L6-v2 (Xenova/transformers)
5. Store in LanceDB for fast vector search
6. Cache index for subsequent loads

When agent receives a query, relevant knowledge chunks are retrieved and injected into context.

## Memory

Three levels:
1. **Conversation history** — current chat messages (in-memory + SQLite)
2. **Agent memory** — persistent key-value memories per agent per user (SQLite)
3. **Client context** — shared knowledge that compounds over time (future: sync)

## Agents

| Agent | Role Access | Primary Use |
|-------|-------------|-------------|
| SEO Agent | admin, developer | Site audits, keyword research, content briefs, technical fixes |
| Ads Agent | admin, paid-media | Campaign setup, budget optimization, performance reporting |
| Content Editor | admin, editor | Editing briefs, caption generation, content scheduling |
| Account Manager | admin, account-manager | Client reports, meeting prep, status updates |
| DIY Agent | admin, developer | Customizable base agent, bring your own knowledge |

## Key Design Decisions

1. **Claude over OpenAI** — Better at complex reasoning, tool use, and following nuanced instructions. The agents need to be genuinely smart, not just fast.
2. **MCP for tools** — Standard protocol, growing ecosystem. Don't reinvent integrations.
3. **Stagehand for browser** — AI-native browser automation, more reliable than raw Playwright selectors.
4. **Local everything** — Knowledge, memory, embeddings all run locally. No server dependency. Privacy-first.
5. **Tauri over Electron** — 10x lighter, native performance, Rust security. Team doesn't need 200MB Chromium bloat.
6. **Context engineering as a first-class concern** — Using muratcankoylan's patterns for attention management, compression, and context optimization.

## Key Resources

- Context Engineering Skills: github.com/muratcankoylan/Agent-Skills-for-Context-Engineering
- MCP Servers: github.com/punkpeye/awesome-mcp-servers
- Stagehand (browser): github.com/browserbase/stagehand
- Mastra (agent framework reference): github.com/mastra-ai/mastra
- Deer Flow (skill architecture reference): github.com/bytedance/deer-flow
- GitNexus (codebase intelligence): github.com/abhigyanpatwari/GitNexus
- Composio (tool integrations): github.com/ComposioHQ/composio
