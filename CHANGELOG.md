# Changelog

## v2.0.0 — 2026-02-24

### Multi-Provider LLM Support
- **Provider Registry** (`agent-runtime/src/llm/provider-registry.ts`) — hot-swappable LLM backends
- **Anthropic, OpenAI, Google Gemini, Ollama, OpenRouter** providers (`agent-runtime/src/llm/providers/`)
- **Smart Router** (`agent-runtime/src/llm/router.ts`) — complexity-based model selection with cost awareness
- **Cost Tracker** (`agent-runtime/src/llm/cost-tracker.ts`) — per-conversation cost tracking with daily/monthly limits
- Frontend **ModelSelector** component for runtime provider switching

### Structured Memory System
- **Structured Memory Store** (`agent-runtime/src/memory/structured.ts`) — entity-based fact storage with confidence scores
- **Fact Extractor** (`agent-runtime/src/memory/extractor.ts`) — LLM-powered automatic fact extraction from conversations
- **Working Memory** (`agent-runtime/src/memory/working.ts`) — per-conversation scratchpad agents can read/write mid-task
- **Conversation Persistence** (`agent-runtime/src/memory/conversations.ts`) — conversations survive app restarts
- Frontend **MemoryInspector** panel for browsing/editing/deleting memories

### Durable Execution
- **Checkpoint Manager** (`agent-runtime/src/agent/checkpoint.ts`) — saves agent loop state after each tool call
- Crash recovery: resume from last checkpoint on restart

### Context Engineering
- **Context Manager** (`agent-runtime/src/context/manager.ts`) — token budget allocation across system prompt, knowledge, memory, conversation
- **Skill Loader** (`agent-runtime/src/context/skill-loader.ts`) — loads SKILL.md files and injects relevant skills per query
- **Context Builder** (`agent-runtime/src/agent/context.ts`) — assembles the full prompt with all context sources

### Knowledge Engine
- **LanceDB integration** (`agent-runtime/src/knowledge/lancedb.ts`) — vector storage with nomic-embed via Ollama
- **Embedder** (`agent-runtime/src/knowledge/embedder.ts`) — Ollama-powered embedding generation
- **Knowledge Graph** (`agent-runtime/src/knowledge/graph.ts`) — relational knowledge structure

### Eval Framework
- **Turn Scorer** (`agent-runtime/src/eval/scorer.ts`) — heuristic quality scoring per agent turn
- **Eval Tracker** (`agent-runtime/src/eval/tracker.ts`) — persistent eval results in SQLite

### Telemetry
- **Usage Tracker** (`agent-runtime/src/telemetry/usage.ts`) — token usage by agent, model, day
- **Cost Tracker** (`agent-runtime/src/telemetry/cost.ts`) — dollar cost estimation
- **Latency Tracker** (`agent-runtime/src/telemetry/latency.ts`) — TTFT and total latency per provider/model

### Tool System Enhancements
- **Tool Selector** (`agent-runtime/src/skills/selector.ts`) — dynamic tool selection when too many tools available
- **MCP Server Manager** (`agent-runtime/src/mcp/manager.ts`) — auto-restart, health monitoring for MCP servers

### Frontend
- **Analytics Dashboard** (`src/components/analytics/Dashboard.tsx`) — usage stats, cost breakdown, model distribution
- **Conversation sidebar** with history, resume, delete
- **Onboarding flow** — Welcome → API Key → Role Select

### Rust Backend (Tauri v2)
- New IPC commands: `list_conversations`, `load_conversation`, `delete_conversation`, `set_provider`, `list_providers`, `get_usage_stats`, `get_cost_stats`, `get_memories`, `get_working_memory`
- Sidecar JSON-RPC manager with request/response correlation

### Agent Manifest v2
- Backward-compatible loader supports both v1 and v2 manifest formats
- New fields: `memory`, `context`, `guardrails`, `providers` configuration
