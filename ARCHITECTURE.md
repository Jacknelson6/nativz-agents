# Nativz Agents v2.0 — Architecture

## Overview

Nativz Agents is a **Tauri v2 desktop application** for running local-first AI agents specialized for digital marketing agencies. Three-layer architecture: React frontend, Rust shell, Node.js sidecar runtime.

**Stats:** ~130 source files, ~18,000 LOC across TypeScript, TSX, and Rust.

```
┌──────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite + Tailwind)           │
│  ChatView · AgentPicker · AgentBuilder · AgentMarketplace    │
│  Dashboard · CostCalculator · MemoryInspector · Settings     │
│  KnowledgeBrowser · CommandPalette · NotificationCenter      │
│  Onboarding (Welcome → RoleSelect → ApiKeySetup)             │
├──────────────────────┬───────────────────────────────────────┤
│   Rust Backend       │  IPC Bridge (14 Tauri commands)       │
│   (Tauri v2 Shell)   │                                      │
│   • Settings store   │  stdio JSON-RPC (15 handlers)        │
│   • Sidecar manager  ├───────────────────────────────────────┤
│   • Process lifecycle│  Node.js Agent Runtime (sidecar)      │
│                      │  LLM · Memory · Skills · Knowledge    │
│                      │  MCP · Browser · Eval · Telemetry     │
│                      │  Webhooks · API Server · Batch        │
└──────────────────────┴───────────────────────────────────────┘
```

---

## Layer 1: React Frontend (`src/`)

### State Management (Zustand)
| Store | Purpose |
|-------|---------|
| `chatStore` | Messages, streaming state, active conversation |
| `agentStore` | Agent list, selected agent, agent configs |
| `analyticsStore` | Usage stats, cost stats |
| `appStore` | Settings, theme, onboarding state |
| `modelStore` | Provider list, selected model, model switching |

### Components

**Chat System:**
- `ChatView` — Main chat interface with streaming support
- `InputBar` — Message input with file upload, slash commands
- `MessageBubble` — Rich message rendering (markdown, code blocks)
- `StreamingMessage` — Token-by-token streaming display
- `ThinkingIndicator` — Agent reasoning visualization
- `ToolStatus` — Real-time tool execution status
- `PlanView` — Multi-step plan visualization
- `ArtifactCard` / `ArtifactRenderer` — Rich output rendering
- `MessageActions` — Copy, regenerate, feedback
- `ModelSelector` — Per-message model selection

**Agent Management:**
- `AgentPicker` — Agent selection sidebar
- `AgentBuilder` — Custom agent creation with model/skill/knowledge config
- `AgentMarketplace` — Browse, install, duplicate agent templates; star/favorite; category filtering

**Analytics:**
- `Dashboard` — Token usage, cost tracking, per-agent/per-model breakdown
- `CostCalculator` — Cost optimization advisor: spending breakdown, model switching recommendations, subscription vs API comparison

**Knowledge & Memory:**
- `KnowledgeBrowser` — Browse and manage agent knowledge bases
- `MemoryInspector` — View working memory, entity graph, stored facts

**Layout:**
- `Sidebar` — Navigation, conversation list
- `TopBar` — Agent info, controls
- `StatusBar` — Connection status, token count
- `CommandPalette` — Cmd+K quick actions
- `NotificationCenter` — System notifications

**Settings & Onboarding:**
- `Settings` — App configuration
- `ProviderConfig` — API key and provider management
- `Welcome` → `RoleSelect` → `ApiKeySetup` — First-run flow

---

## Layer 2: Rust Backend (`src-tauri/src/`)

8 Rust source files, ~650 LOC. Thin shell that:

1. **Manages the sidecar** — Spawns/kills the Node.js agent-runtime process
2. **Settings persistence** — SQLite-backed settings store
3. **IPC bridge** — 14 Tauri commands that proxy to JSON-RPC

### IPC Commands (all registered in invoke_handler)
`get_settings`, `save_settings`, `list_agents`, `send_message`, `get_history`, `list_conversations`, `load_conversation`, `set_provider`, `list_providers`, `get_usage_stats`, `delete_conversation`, `get_memories`, `get_working_memory`, `get_cost_stats`

---

## Layer 3: Agent Runtime (`agent-runtime/src/`)

The core intelligence layer. ~84 TypeScript files, ~14,000 LOC. Runs as a sidecar process communicating via stdio JSON-RPC.

### Agent System (`agent/`)
| Module | Purpose |
|--------|---------|
| `runtime.ts` | Main AgentRuntime class — orchestrates LLM, memory, tools, context |
| `loader.ts` | Loads agent manifests from YAML/JSON configs |
| `context.ts` | Context window assembly (system prompt + memory + knowledge + history) |
| `planner.ts` | Multi-step task planning and decomposition |
| `reflection.ts` | Self-evaluation and output improvement |
| `chain.ts` | Sequential agent chaining (output → input) |
| `parallel.ts` | Parallel agent execution for independent subtasks |
| `handoff.ts` | Agent-to-agent handoff with context transfer |
| `scheduling.ts` | Cron-based scheduled agent tasks |
| `checkpoint.ts` | Conversation state persistence for recovery |
| `guardrails.ts` | Input/output validation, safety filtering |
| `streaming-ui.ts` | Streaming UI event protocol |
| `structured-output.ts` | JSON schema-constrained output |
| `conversation-title.ts` | Auto-generated conversation titles |
| `batch.ts` | **Batch processing** — process arrays of items through an agent with configurable concurrency, progress tracking, CSV/JSON input |
| `templates.ts` | **Prompt template engine** — Handlebars-style interpolation, SQLite-backed, pre-built templates for SEO/ads/content/email |

### LLM Layer (`llm/`)
| Module | Purpose |
|--------|---------|
| `client.ts` | Unified LLM client interface |
| `router.ts` | Smart model routing based on task complexity |
| `provider-registry.ts` | Dynamic provider registration |
| `streaming.ts` | SSE/streaming response handling |
| `cost-tracker.ts` | Per-conversation cost tracking with budgets |
| `prompt-optimizer.ts` | Automatic prompt compression/optimization |
| `token-cache.ts` | Token count caching for context management |
| `providers/` | Anthropic, OpenAI, Google Gemini, Ollama, OpenRouter |

### Memory System (`memory/`)
| Module | Purpose |
|--------|---------|
| `store.ts` | SQLite-backed key-value memory |
| `structured.ts` | Typed memory with categories (facts, preferences, decisions) |
| `working.ts` | Session-scoped working memory |
| `conversations.ts` | Conversation persistence with full message history |
| `extractor.ts` | Automatic fact extraction from conversations |
| `summarizer.ts` | Progressive conversation summarization |
| `entity-graph.ts` | Entity relationship graph |

### Knowledge System (`knowledge/`)
| Module | Purpose |
|--------|---------|
| `search.ts` | Hybrid search (keyword + semantic + reranking) |
| `embedder.ts` | Text embedding with caching |
| `lancedb.ts` | LanceDB vector store integration |
| `loader.ts` | Document ingestion (PDF, MD, TXT, HTML) |
| `graph.ts` | Knowledge graph construction |
| `reranker.ts` | Cross-encoder reranking |
| `contextual-compression.ts` | Context-aware chunk compression |

### Skills/Tools (`skills/`)
14 built-in skills:
- **Web:** `web-search`, `web-crawl`, `http-request`
- **Files:** `file-read`, `file-write`
- **Memory:** `memory-read`, `memory-write`, `memory-list`, `memory-delete`
- **Browser:** `stagehand-act`, `stagehand-extract`, `stagehand-observe`, `screenshot`

Plus: `registry.ts` (skill registration), `executor.ts` (safe execution with timeout), `selector.ts` (AI-driven tool selection)

### Browser Automation (`browser/`)
- `manager.ts` — Browser lifecycle management
- `pool.ts` — Browser instance pooling
- `stagehand.ts` — Stagehand integration for AI-driven browser control

### MCP Integration (`mcp/`)
- `client.ts` — MCP client implementation
- `manager.ts` — Server lifecycle management
- `registry.ts` — Tool registry from MCP servers
- `discovery.ts` — Auto-discovery of MCP servers

### Context Engineering (`context/`)
- `manager.ts` — Token budget allocation across context sections
- `skill-loader.ts` — Dynamic skill injection based on conversation context

### Evaluation (`eval/`)
- `scorer.ts` — Per-turn quality scoring (relevance, tool use, factuality)
- `tracker.ts` — Evaluation history and regression detection

### Telemetry (`telemetry/`)
- `usage.ts` — Token usage tracking by agent, model, time period
- `cost.ts` — Cost calculation with configurable per-model pricing
- `latency.ts` — Response latency tracking and percentile analysis

### Integrations (`integrations/`)
| Module | Purpose |
|--------|---------|
| `export.ts` | Export conversations as Markdown, JSON, CSV, HTML/PDF |
| `import.ts` | Import conversations and agent configs |
| `webhooks.ts` | **Webhook system** — outgoing event notifications (task_complete, report_generated, etc.) with exponential backoff retry; incoming webhook triggers from Slack/Zapier; SQLite-backed registry |
| `api-server.ts` | **Local REST API** — HTTP server on configurable port; endpoints: POST /chat, GET /agents, GET /conversations, GET /usage; API key auth; bridges to RPC router; lets external tools (Shortcuts, Alfred, CLI) interact with agents |

### External Tools (`tools/`)
- `composio.ts` — Composio integration for 3rd-party tool access

### RPC Layer (`rpc/`)
- `server.ts` — stdio JSON-RPC server (reads from stdin, writes to stdout)
- `router.ts` — Method routing with handler registration
- `types.ts` — Request/response type definitions

---

## Agent Manifests (`agents/`)

5 pre-built agents, each with:
- System prompt and personality
- Model configuration (primary + fast)
- Skill allowlist
- Knowledge base paths
- Memory settings

| Agent | Focus |
|-------|-------|
| `seo` | Technical SEO, keyword research, content optimization |
| `ads` | Paid media strategy, ad copy, budget optimization |
| `content-editor` | Content creation, editing, social media |
| `account-manager` | Client communications, reporting |
| `diy` | General-purpose, user-customizable |

---

## Data Flow

### Chat Message Lifecycle
```
User Input → React ChatView
  → Tauri IPC (invoke send_message)
    → Rust sidecar bridge (JSON-RPC over stdio)
      → AgentRuntime.sendMessage()
        → Context assembly (system + memory + knowledge + history)
        → SmartRouter selects model
        → LLM provider call (streaming)
        → Tool execution loop (up to 20 iterations)
        → Fact extraction → memory update
        → Response streamed back
      ← JSON-RPC response
    ← Tauri event (stream chunks)
  ← React state update
UI renders streaming response
```

### Webhook Event Flow
```
Agent completes task → WebhookManager.emit()
  → Filter matching webhooks by event type
  → POST to each registered URL
  → On failure: exponential backoff retry (up to 5 attempts)
  → Delivery history stored in SQLite
```

### External API Flow
```
External tool (Shortcuts/Alfred/CLI)
  → HTTP request to localhost:9876
  → API key validation
  → Route matching
  → RPC call to agent runtime
  → Response returned as JSON
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri v2 (Rust) |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| State | Zustand |
| Backend runtime | Node.js (TypeScript, ESM) |
| Database | SQLite (better-sqlite3) — memory, conversations, templates, webhooks |
| Vector store | LanceDB |
| LLM providers | Anthropic, OpenAI, Google Gemini, Ollama, OpenRouter |
| Browser automation | Stagehand (Playwright-based) |
| Tool protocol | Model Context Protocol (MCP) |
| IPC | JSON-RPC over stdio |

---

## Security Model

- **Local-first:** All data stored locally in SQLite databases
- **API keys:** Stored in Tauri secure settings store
- **API server:** Binds to 127.0.0.1 only, requires API key header
- **Guardrails:** Input/output validation, tool execution sandboxing
- **Budget limits:** Configurable daily/monthly cost limits with automatic cutoff
