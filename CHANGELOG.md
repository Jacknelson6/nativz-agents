# Changelog

## v3.0.0 — 2026-02-24

### Agent Marketplace & Profiles
- **AgentMarketplace** — browse, search, and install community agents with categories and ratings
- **AgentProfile** — detailed agent stats: conversation history, memory usage, cost breakdown, performance metrics
- Sidebar navigation for Marketplace

### Advanced Knowledge Pipeline
- **Contextual Compression** (`knowledge/contextual-compression.ts`) — reduce retrieved chunks to relevant fragments
- **Live Context** (`knowledge/live-context.ts`) — real-time context injection from active sources
- **Reranker** (`knowledge/reranker.ts`) — cross-encoder reranking for better retrieval precision
- **Knowledge Search** (`knowledge/search.ts`) — unified search across all knowledge sources
- **Document Loader** (`knowledge/loader.ts`) — ingest PDFs, markdown, HTML, text files

### Browser Automation
- **Stagehand Integration** — act, observe, extract, screenshot tools via Playwright
- **Browser Pool** (`browser/pool.ts`) — managed browser instances with connection pooling
- **Browser Manager** (`browser/manager.ts`) — lifecycle management for headless browsers

### Multi-Agent Orchestration
- **Agent Handoff** (`agent/handoff.ts`) — seamless task delegation between specialized agents
- **Parallel Execution** (`agent/parallel.ts`) — run multiple agents concurrently on subtasks
- **Batch Processing** (`agent/batch.ts`) — process large task queues efficiently
- **Chain Execution** (`agent/chain.ts`) — sequential multi-agent pipelines
- **Agent Scheduling** (`agent/scheduling.ts`) — cron-like recurring agent tasks

### Advanced Agent Capabilities
- **Planner** (`agent/planner.ts`) — multi-step task decomposition before execution
- **Reflection** (`agent/reflection.ts`) — self-critique and output improvement loops
- **Structured Output** (`agent/structured-output.ts`) — JSON schema validation for agent responses
- **Learning** (`agent/learning.ts`) — agents improve from past interactions
- **Conversation Export** (`agent/conversation-export.ts`) — export chats as markdown/JSON
- **Conversation Titles** (`agent/conversation-title.ts`) — auto-generated titles from first message

### Integrations
- **API Server** (`integrations/api-server.ts`) — HTTP API for external tool access
- **Webhooks** (`integrations/webhooks.ts`) — incoming webhook handlers for triggers
- **Import/Export** (`integrations/export.ts`, `import.ts`) — agent configuration portability
- **Composio** (`tools/composio.ts`) — 100+ third-party app integrations

### MCP (Model Context Protocol)
- **MCP Client** (`mcp/client.ts`) — connect to any MCP-compatible tool server
- **MCP Manager** (`mcp/manager.ts`) — auto-restart, health monitoring, connection pooling
- **MCP Discovery** (`mcp/discovery.ts`) — auto-detect available MCP servers
- **MCP Registry** (`mcp/registry.ts`) — catalog of known MCP server configurations

### Frontend Polish
- **ErrorBoundary** wrapping full layout — graceful crash recovery
- **NotificationCenter** — in-app notification system
- **UpdateBanner** — auto-update notifications
- **CommandPalette** — Cmd+K quick actions
- **CostCalculator** — estimate costs before running tasks
- **OnboardingV2** — improved first-run experience
- **ArtifactCard/Renderer** — rich artifact display (code, charts, tables)

### LLM Enhancements
- **Token Cache** (`llm/token-cache.ts`) — semantic caching to avoid redundant LLM calls
- **Prompt Optimizer** (`llm/prompt-optimizer.ts`) — automatic prompt compression and optimization
- **Streaming** (`llm/streaming.ts`) — unified streaming interface across all providers

### Memory Enhancements
- **Entity Graph** (`memory/entity-graph.ts`) — relationship mapping between entities
- **Summarizer** (`memory/summarizer.ts`) — progressive conversation summarization

---

## v2.0.0 — 2026-02-24

### Multi-Provider LLM Support
- **Provider Registry** — hot-swappable LLM backends
- **Anthropic, OpenAI, Google Gemini, Ollama, OpenRouter** providers
- **Smart Router** — complexity-based model selection with cost awareness
- **Cost Tracker** — per-conversation cost tracking with daily/monthly limits
- Frontend **ModelSelector** for runtime provider switching

### Structured Memory System
- **Structured Memory Store** — entity-based fact storage with confidence scores
- **Fact Extractor** — LLM-powered automatic fact extraction
- **Working Memory** — per-conversation scratchpad
- **Conversation Persistence** — survive app restarts
- Frontend **MemoryInspector** panel

### Durable Execution
- **Checkpoint Manager** — saves agent loop state after each tool call
- Crash recovery from last checkpoint

### Context Engineering
- **Context Manager** — token budget allocation
- **Skill Loader** — SKILL.md injection per query
- **Context Builder** — full prompt assembly

### Knowledge Engine
- **LanceDB** vector storage with nomic-embed via Ollama
- **Embedder** — Ollama-powered embeddings
- **Knowledge Graph** — relational knowledge structure

### Eval Framework
- **Turn Scorer** — heuristic quality scoring
- **Eval Tracker** — persistent results in SQLite

### Telemetry
- Usage, cost, and latency tracking per agent/model/day

### Tool System
- **Tool Selector** — dynamic tool selection
- **14 built-in tools**: file-read, file-write, http-request, web-search, web-crawl, screenshot, memory-read/write/list/delete, stagehand-act/observe/extract

### Rust Backend (Tauri v2)
- 14 IPC commands bridging frontend ↔ sidecar
- Sidecar JSON-RPC manager with correlation IDs

---

## v1.0.0 — 2026-02-23

### Core Architecture
- **Tauri v2** desktop app with React 19 frontend
- **Sidecar pattern**: Node.js agent runtime managed by Rust backend
- **JSON-RPC** communication between Rust and Node.js
- **Zustand** state management (app, agent, chat, model, analytics stores)

### Agent System
- **Agent Manifest** format (YAML-based agent definitions)
- **Agent Loader** — parse and validate agent manifests
- **Agent Runtime** — agentic loop with tool calling
- **5 built-in agents**: Account Manager, Ads, Content Editor, DIY, SEO

### Chat Interface
- **ChatView** with message bubbles and streaming
- **InputBar** with file attachment, voice input, model selector
- **ThinkingIndicator** — animated thinking state
- **MessageActions** — copy, edit, regenerate

### Settings
- API key configuration
- Provider selection
- Theme preferences

### Onboarding
- Welcome → API Key → Role Select flow

---

## v0.1.0 — 2026-02-22

### Initial Scaffolding
- Tauri v2 project setup with React + TypeScript + Vite
- Basic project structure and configuration
- Tailwind CSS 4 integration
