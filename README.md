# Nativz Agents

A native desktop AI agent platform built with [Tauri v2](https://tauri.app/) + React + TypeScript. Specialized marketing agents powered by Claude, with deep knowledge bases, MCP tool integration, and a skill system.

## Agents

| Agent | Description |
|-------|-------------|
| **SEO Strategist** 🔍 | Technical SEO, on-page optimization, keyword research, link building, local SEO |
| **Paid Media** 📢 | Ad campaign creation and management across Google, Meta, and TikTok |
| **Content Editor** ✏️ | Edit and refine content for social media, blogs, and marketing materials |
| **Account Manager** 📋 | Track client deliverables, deadlines, and communication |
| **DIY Assistant** 🛠️ | General-purpose agent for custom tasks and workflows |

## Prerequisites

- **Node.js** 20+
- **Rust** (install via [rustup](https://rustup.rs/))
- **npm** (comes with Node.js)

## Setup

```bash
# Clone the repo
git clone https://github.com/nativz/nativz-agents.git
cd nativz-agents

# Install frontend dependencies
npm install

# Install agent runtime dependencies
cd agent-runtime && npm install && cd ..

# Copy env and add your API keys
cp .env.example .env
```

Edit `.env` and set your `ANTHROPIC_API_KEY`.

## Development

```bash
npm run tauri dev
```

This starts both the Vite dev server (frontend) and the Tauri app (Rust + agent runtime sidecar).

## Build

```bash
npm run tauri build
```

## Setting Your API Key

You can set your Anthropic API key in two ways:

1. **Environment variable**: Set `ANTHROPIC_API_KEY` in `.env`
2. **In-app**: Go to Settings and enter your API key

## Project Structure

```
nativz-agents/
├── src/                    # React frontend (TypeScript + Tailwind)
│   ├── components/         # UI components (chat, agents, settings, onboarding)
│   ├── stores/             # Zustand state stores
│   └── lib/                # Tauri API bindings, types
├── src-tauri/              # Rust backend (Tauri v2)
│   └── src/
│       ├── lib.rs          # App setup, sidecar lifecycle
│       ├── sidecar/        # JSON-RPC sidecar manager
│       └── commands/       # Tauri commands (chat, agents, settings)
├── agent-runtime/          # Node.js agent runtime (Claude SDK)
│   └── src/
│       ├── agent/          # Agent loader, runtime, manifest parsing
│       ├── llm/            # Claude client, streaming, routing
│       ├── skills/         # Skill system
│       ├── knowledge/      # Knowledge base loader
│       ├── memory/         # Conversation memory
│       ├── mcp/            # MCP server integration
│       └── rpc/            # JSON-RPC server (stdin/stdout)
├── agents/                 # Agent manifests and configs
│   ├── seo/                # SEO agent (94KB knowledge base)
│   ├── ads/                # Paid media agent
│   ├── content-editor/     # Content editing agent
│   ├── account-manager/    # Account management agent
│   └── diy/                # General-purpose agent
└── skills/                 # Context engineering skills (git submodule)
```

## Architecture

The app uses a **sidecar pattern**: the Tauri Rust backend spawns the Node.js agent runtime as a child process and communicates via JSON-RPC over stdin/stdout. The React frontend calls Tauri commands, which proxy to the agent runtime.

```
React Frontend ←→ Tauri (Rust) ←→ Agent Runtime (Node.js/Claude)
```

## Testing

```bash
# Run smoke tests
./scripts/test-agents.sh

# Test an agent interactively
cd agent-runtime
ANTHROPIC_API_KEY=sk-ant-... npx tsx src/cli.ts --agent seo

# Test with a single message
ANTHROPIC_API_KEY=sk-ant-... npx tsx src/cli.ts --agent seo --message "What are the most important Core Web Vitals metrics?"
```

## License

MIT
