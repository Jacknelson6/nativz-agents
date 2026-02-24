# Nativz Agents v2.0 — Architecture

## Overview

Nativz Agents is a Tauri v2 desktop application for running local-first AI agents. It consists of three layers:

```
┌─────────────────────────────────────────────────────┐
│              React Frontend (Vite + Tailwind)        │
│  AgentPicker · ChatView · ModelSelector · Dashboard  │
│  MemoryInspector · Settings · Onboarding             │
├──────────────────────┬──────────────────────────────┤
│   Rust Backend       │  IPC (invoke/listen)          │
│   (Tauri v2 Shell)   │                              │
│   • Settings store   │  stdio JSON-RPC              │
│   • Sidecar manager  ├──────────────────────────────┤
│   • Agent list       │  Node.js Agent Runtime       │
│   • Process lifecycle│  (sidecar process)           │
└──────────────────────┴──────────────────────────────┘
```

## Frontend (`src/`)

React 19 + TypeScript + Tailwind CSS. State via Zustand stores:

| Store | Purpose |
|-------|---------|
| `appStore` | Settings, view routing, onboarding state |
| `agentStore` | Agent list, selected agent |
| `chatStore` | Messages, conversation state |
| `modelStore` | Provider/model selection |
| `analyticsStore` | Usage & cost stats |

All Tauri IPC calls go through `src/lib/tauri.ts` which wraps `@tauri-apps/api/core invoke()`.

## Rust Backend (`src-tauri/`)

Minimal orchestration layer. Key responsibilities:
- **Sidecar management** — spawns the Node.js agent runtime as a child process, communicates via JSON-RPC over stdio
- **Settings persistence** — reads/writes `settings.json` in the app data directory
- **Agent discovery** — reads `agents/*/manifest.json` for the agent picker
- **IPC bridge** — 12 Tauri commands that proxy to the sidecar's RPC methods

### Tauri Commands → RPC Methods

| Tauri Command | RPC Method | Direction |
|---------------|------------|-----------|
| `list_agents` | (local Rust) | Rust only |
| `get_settings` / `save_settings` | `set_api_key` | Rust + RPC |
| `send_message` | `send_message` | → sidecar |
| `get_history` | `get_history` | → sidecar |
| `list_conversations` | `list_conversations` | → sidecar |
| `load_conversation` | `load_conversation` | → sidecar |
| `delete_conversation` | `delete_conversation` | → sidecar |
| `set_provider` | `set_provider` | → sidecar |
| `list_providers` | `list_providers` | → sidecar |
| `get_usage_stats` | `get_usage_stats` | → sidecar |
| `get_cost_stats` | `get_cost_stats` | → sidecar |
| `get_memories` | `get_memories` | → sidecar |
| `get_working_memory` | `get_working_memory` | → sidecar |

## Agent Runtime (`agent-runtime/`)

Node.js sidecar process. Entry point: `src/index.ts` (RPC server). Core class: `AgentRuntime` in `src/agent/runtime.ts`.

### Module Map

```
agent-runtime/src/
├── agent/
│   ├── runtime.ts        # Core AgentRuntime class (orchestrates everything)
│   ├── loader.ts         # Manifest loading (v1 + v2 compat)
│   ├── context.ts        # Prompt assembly (system + knowledge + memory)
│   └── checkpoint.ts     # Durable execution checkpoints
├── llm/
│   ├── client.ts         # ClaudeClient (legacy Anthropic SDK wrapper)
│   ├── provider-registry.ts  # Multi-provider registry
│   ├── router.ts         # SmartRouter + complexity classification
│   ├── cost-tracker.ts   # Per-conversation cost tracking
│   ├── streaming.ts      # (legacy, unused — streaming handled in client.ts)
│   └── providers/
│       ├── types.ts      # LLMProvider interface
│       ├── anthropic.ts  # Claude provider
│       ├── openai.ts     # GPT provider
│       ├── gemini.ts     # Google Gemini provider
│       ├── ollama.ts     # Local Ollama provider
│       └── openrouter.ts # OpenRouter fallback
├── memory/
│   ├── store.ts          # Legacy key-value SQLite store
│   ├── structured.ts     # Entity-based fact memory with confidence
│   ├── working.ts        # Per-conversation scratchpad
│   ├── conversations.ts  # Conversation persistence
│   ├── extractor.ts      # LLM-powered fact extraction
│   └── summarizer.ts     # Conversation summarization
├── knowledge/
│   ├── search.ts         # Vector + keyword hybrid search
│   ├── lancedb.ts        # LanceDB vector store
│   ├── embedder.ts       # Ollama embedding generation
│   ├── loader.ts         # Knowledge file ingestion
│   └── graph.ts          # Knowledge graph
├── skills/
│   ├── registry.ts       # Skill registration + Claude tool conversion
│   ├── executor.ts       # Skill execution engine
│   ├── selector.ts       # Dynamic tool selection
│   └── builtin/          # 13 built-in skills
├── mcp/
│   ├── registry.ts       # MCP server connection (legacy)
│   ├── manager.ts        # MCP server lifecycle (v2, auto-restart)
│   ├── client.ts         # MCP protocol client
│   └── discovery.ts      # MCP server discovery
├── context/
│   ├── manager.ts        # Token budget allocation
│   └── skill-loader.ts   # SKILL.md file loading
├── eval/
│   ├── scorer.ts         # Heuristic turn quality scoring
│   └── tracker.ts        # Persistent eval results
├── telemetry/
│   ├── usage.ts          # Token usage tracking
│   ├── cost.ts           # Cost estimation
│   └── latency.ts        # Latency tracking
├── browser/
│   ├── manager.ts        # Browser lifecycle
│   ├── pool.ts           # Browser pool
│   └── stagehand.ts      # Stagehand automation
├── tools/
│   └── composio.ts       # Composio tool integration
├── rpc/
│   ├── router.ts         # JSON-RPC method router
│   ├── server.ts         # stdio JSON-RPC server
│   └── types.ts          # RPC type definitions
├── index.ts              # Entry point (registers all RPC handlers)
└── cli.ts                # CLI for direct testing
```

### Agent Loop Flow

1. User sends message via frontend → Rust `send_message` → RPC `send_message`
2. Runtime summarizes conversation if needed
3. Builds context: system prompt + knowledge search + memory recall + working memory
4. Selects model via SmartRouter (complexity classification)
5. Selects relevant tools via ToolSelector
6. Enters agent loop (max 20 iterations):
   - Call LLM with context + tools
   - If tool_use: execute tools, checkpoint, continue loop
   - If text: return response, persist conversation, extract facts async
7. Score turn quality, record telemetry

### Data Storage

All SQLite databases stored in `data/` directory:
- `memory.db` — legacy key-value memory
- `structured_memory.db` — entity-based facts
- `conversations.db` — conversation history
- `checkpoints.db` — durable execution state
- `working_memory.db` — per-conversation scratchpad
- `eval.db` — turn quality scores
- `usage.db` — token usage stats
- `latency.db` — provider latency data

Each store initializes its own tables on construction.

## Agent Manifests (`agents/`)

Each agent has a `manifest.json` defining:
- Identity (name, description, icon, system prompt)
- Model configuration (primary, fast, embedding models)
- Knowledge paths (markdown/text files to index)
- MCP server connections
- Memory settings (fact extraction, working memory size)
- Context budget allocation
- Guardrails (max tokens per turn, allowed tools)

The loader (`agent/loader.ts`) supports both v1 (flat) and v2 (nested) manifest formats.
