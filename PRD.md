# Nativz Agents v2.0 — Frontier Architecture PRD

> Product Requirements Document for upgrading Nativz Agents from v0.1 prototype to frontier-grade AI agent desktop application.

**Date:** Feb 24, 2026
**Owner:** Jack Nelson
**Status:** In Progress

---

## 1. Executive Summary

Nativz Agents v0.1 is a working Tauri v2 desktop app with 5 pre-built AI agents, a custom Node.js runtime, and basic chat/tool/knowledge capabilities. This PRD defines the upgrade to v2.0 — incorporating every frontier advancement identified in the Feb 2026 ecosystem survey.

**Goal:** Ship the most advanced local-first AI agent desktop app possible, built for a 15-person social media agency, product-grade for future external distribution.

---

## 2. Current State (v0.1)

### What Exists
- Tauri v2 shell (Rust + React + TypeScript + Tailwind)
- Custom agent runtime (28 TS files, JSON-RPC sidecar)
- Claude SDK (Anthropic only, hardcoded)
- 5 agent manifests with expert knowledge (240KB total)
- Basic model router (simple/complex binary classification)
- SQLite memory (key-value only, LIKE-based search)
- Bag-of-words vector search (no real embeddings)
- 9 built-in skills + MCP client
- Stagehand browser automation
- Conversation summarizer
- Onboarding flow, dark theme UI

### What's Missing (Gaps)
1. **No multi-provider LLM support** — Claude only, no model switching
2. **No structured memory** — SQLite LIKE search, no fact extraction, no semantic recall
3. **No real embeddings** — Bag-of-words fallback, not production-grade
4. **No durable execution** — Crash = lost state
5. **No eval framework** — No way to measure agent quality
6. **Thin tool layer** — 9 built-in skills vs 1000+ available via Composio
7. **No MCP Apps** — No inline UI rendering for dashboards/charts
8. **No knowledge graphs** — Flat vector search, no relational understanding
9. **No working memory** — No editable scratchpad agents can modify mid-task
10. **No context engineering** — No compression, no attention management
11. **No conversation persistence across sessions** — History lost on app restart

---

## 3. Target Architecture (v2.0)

```
┌────────────────────────────────────────────────────────────────┐
│                     TAURI v2 SHELL (Rust)                      │
│                                                                │
│  ┌─────────────────────┐   IPC    ┌──────────────────────────┐│
│  │    RUST BACKEND      │◄───────►│    REACT FRONTEND        ││
│  │                      │         │                          ││
│  │ • Secure key store   │         │ • Agent Picker           ││
│  │ • Process management │         │ • Chat w/ streaming      ││
│  │ • File system access │         │ • Model selector UI      ││
│  │ • SQLite manager     │         │ • MCP Apps renderer      ││
│  │ • Auto-updater       │         │ • Memory inspector       ││
│  │ • Crash recovery     │         │ • Agent config editor    ││
│  └──────────┬───────────┘         │ • Onboarding             ││
│             │ stdio JSON-RPC      │ • Knowledge browser      ││
│  ┌──────────▼───────────────────┐ │ • Eval dashboard         ││
│  │   NODE.JS AGENT RUNTIME v2   │ └──────────────────────────┘│
│  │                               │                             │
│  │  ┌──────────────────────────┐│                             │
│  │  │  MULTI-PROVIDER LLM      ││                             │
│  │  │  • Anthropic Claude      ││                             │
│  │  │  • OpenAI GPT            ││                             │
│  │  │  • Google Gemini         ││                             │
│  │  │  • Ollama (local)        ││                             │
│  │  │  • OpenRouter (fallback) ││                             │
│  │  │  • Cost tracking/limits  ││                             │
│  │  └──────────────────────────┘│                             │
│  │                               │                             │
│  │  ┌──────────────────────────┐│                             │
│  │  │  AGENT LOOP v2           ││                             │
│  │  │  • Durable execution     ││                             │
│  │  │  • Checkpointing         ││                             │
│  │  │  • Working memory        ││                             │
│  │  │  • Context engineering   ││                             │
│  │  │  • Structured outputs    ││                             │
│  │  └──────────────────────────┘│                             │
│  │                               │                             │
│  │  ┌──────────────────────────┐│                             │
│  │  │  MEMORY SYSTEM           ││                             │
│  │  │  • Mem0-style extraction ││                             │
│  │  │  • Semantic search       ││                             │
│  │  │  • Per-client memories   ││                             │
│  │  │  • Working memory blocks ││                             │
│  │  │  • Conversation persist  ││                             │
│  │  └──────────────────────────┘│                             │
│  │                               │                             │
│  │  ┌──────────────────────────┐│                             │
│  │  │  KNOWLEDGE ENGINE        ││                             │
│  │  │  • LanceDB vectors       ││                             │
│  │  │  • nomic-embed via Ollama││                             │
│  │  │  • LightRAG graph layer  ││                             │
│  │  │  • Hybrid BM25+vector    ││                             │
│  │  │  • Contextual retrieval  ││                             │
│  │  └──────────────────────────┘│                             │
│  │                               │                             │
│  │  ┌──────────────────────────┐│                             │
│  │  │  TOOLS & MCP             ││                             │
│  │  │  • Built-in skills       ││                             │
│  │  │  • MCP server manager    ││                             │
│  │  │  • Composio integration  ││                             │
│  │  │  • MCP Apps UI renderer  ││                             │
│  │  │  • Dynamic tool selection││                             │
│  │  └──────────────────────────┘│                             │
│  │                               │                             │
│  │  ┌──────────────────────────┐│                             │
│  │  │  BROWSER AUTOMATION      ││                             │
│  │  │  • Stagehand (primary)   ││                             │
│  │  │  • Action caching        ││                             │
│  │  │  • Self-healing selectors││                             │
│  │  └──────────────────────────┘│                             │
│  │                               │                             │
│  │  ┌──────────────────────────┐│                             │
│  │  │  EVAL & OBSERVABILITY    ││                             │
│  │  │  • Per-turn quality score││                             │
│  │  │  • Cost tracking         ││                             │
│  │  │  • Latency metrics       ││                             │
│  │  │  • Token usage analytics ││                             │
│  │  │  • Agent comparison evals││                             │
│  │  └──────────────────────────┘│                             │
│  └───────────────────────────────┘                             │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Tasks (Ordered by Priority)

### Phase 1: Core Runtime Upgrades (CRITICAL)

#### 1.1 Multi-Provider LLM Client
**Files:** `agent-runtime/src/llm/client.ts`, `agent-runtime/src/llm/providers/`
**Why:** Users need model flexibility. API costs matter. Subscriptions (Anthropic Max, ChatGPT Pro, Gemini Advanced) give unlimited tokens.

**Requirements:**
- [ ] Abstract LLM interface: `LlmProvider` with `call()` and `streamCall()`
- [ ] Provider implementations:
  - `AnthropicProvider` — Claude (existing, refactor)
  - `OpenAIProvider` — GPT-4.1, GPT-5, o3-mini
  - `GeminiProvider` — Gemini 2.5 Pro, Flash
  - `OllamaProvider` — Local models (llama3, qwen, etc.)
  - `OpenRouterProvider` — Fallback/access to all models
- [ ] Provider registry with hot-swapping (change model mid-conversation)
- [ ] Unified response type across providers (normalize tool_use formats)
- [ ] Cost tracking per provider per conversation
- [ ] Token counting and budget limits (daily/monthly caps)
- [ ] Subscription mode: flag providers as "unlimited" to prefer them for high-volume tasks
- [ ] Model config in manifest: `model.providers[]` with priority order

**Schema:**
```typescript
interface LlmProvider {
  id: string;
  name: string;
  call(options: LlmCallOptions): Promise<LlmResponse>;
  streamCall(options: LlmCallOptions, callbacks?: StreamCallbacks): Promise<LlmResponse>;
  countTokens(text: string): number;
  listModels(): Promise<ModelInfo[]>;
  isAvailable(): Promise<boolean>;
}

interface ProviderConfig {
  provider: "anthropic" | "openai" | "gemini" | "ollama" | "openrouter";
  apiKey?: string;
  baseUrl?: string;
  models: {
    primary: string;
    fast: string;
    embedding?: string;
  };
  costPerMToken?: { input: number; output: number };
  isSubscription?: boolean; // unlimited tokens
  priority: number; // lower = preferred
}
```

#### 1.2 Intelligent Model Router v2
**Files:** `agent-runtime/src/llm/router.ts`
**Why:** Binary simple/complex is too crude. Need multi-signal routing.

**Requirements:**
- [ ] Multi-signal complexity classification:
  - Message length, keyword analysis
  - Tool requirements (browser = complex, file-read = simple)
  - Conversation depth (turn 1 vs turn 20)
  - Agent type (SEO audit = complex, quick caption = simple)
- [ ] Cost-aware routing: prefer subscription/unlimited providers for high-volume
- [ ] Fallback chain: if primary fails, try next provider
- [ ] Latency tracking: route to faster models for interactive tasks
- [ ] User override: manual model selection from UI dropdown
- [ ] Per-agent model preferences in manifest

#### 1.3 Durable Execution & Checkpointing
**Files:** `agent-runtime/src/agent/runtime.ts`, `agent-runtime/src/agent/checkpoint.ts`
**Why:** Crash recovery. Long tasks survive app restart.

**Requirements:**
- [ ] Checkpoint state to SQLite after each tool call:
  - Conversation history
  - Tool call results
  - Working memory state
  - Current loop iteration
- [ ] Resume from checkpoint on restart
- [ ] Checkpoint pruning (keep last 5 per conversation)
- [ ] Expose checkpoint status to UI (show recovery indicator)

#### 1.4 Working Memory
**Files:** `agent-runtime/src/memory/working.ts`
**Why:** Agents need a scratchpad they can edit mid-task. Key for multi-step reasoning.

**Requirements:**
- [ ] Editable memory blocks (key-value, agent can read/write/delete)
- [ ] Injected into system prompt on every turn
- [ ] Auto-populated with: current task summary, key findings, decisions made
- [ ] Skills for agent to manipulate: `memory-read`, `memory-write`, `memory-delete`, `memory-list`
- [ ] Persisted to SQLite (survives restart)
- [ ] Size limit per agent (e.g., 4K tokens working memory)

### Phase 2: Memory & Knowledge (HIGH)

#### 2.1 Structured Memory (Mem0-style)
**Files:** `agent-runtime/src/memory/structured.ts`, `agent-runtime/src/memory/extractor.ts`
**Why:** Agents should automatically learn from conversations. "Remember that Client X prefers blue tones."

**Requirements:**
- [ ] Fact extraction after each conversation turn:
  - Use fast model (Haiku/Flash) to extract facts from assistant+user messages
  - Categories: preference, decision, fact, relationship, task, feedback
  - Confidence score per fact
- [ ] Per-entity memory (per-client, per-brand, per-user)
- [ ] Semantic search over memories (using embeddings)
- [ ] Memory deduplication and conflict resolution
- [ ] Memory decay: older, unused memories ranked lower
- [ ] Memory injection: relevant memories auto-injected into context
- [ ] Memory management UI: view, edit, delete extracted memories

**Schema:**
```typescript
interface StructuredMemory {
  id: string;
  agentId: string;
  entityId: string; // client name, brand, user
  entityType: "client" | "brand" | "user" | "project";
  category: "preference" | "decision" | "fact" | "relationship" | "task" | "feedback";
  content: string;
  confidence: number;
  source: { conversationId: string; turnIndex: number };
  embedding: Float32Array;
  accessCount: number;
  lastAccessed: string;
  createdAt: string;
}
```

#### 2.2 LanceDB + Real Embeddings
**Files:** `agent-runtime/src/knowledge/embedder.ts`, `agent-runtime/src/knowledge/lancedb.ts`
**Why:** Bag-of-words is not production-grade. Need real vector search.

**Requirements:**
- [ ] Replace in-memory bag-of-words with LanceDB (embedded, no server)
- [ ] Embedding via Ollama API (nomic-embed-text-v1.5) or fallback to all-MiniLM-L6-v2 via ONNX
- [ ] Hybrid search: BM25 full-text + vector similarity + reranking
- [ ] Contextual retrieval: prepend document context to each chunk before embedding
- [ ] Incremental indexing: add new docs without re-embedding everything
- [ ] Index persistence: LanceDB tables survive restart
- [ ] Expose embedding status to UI (show indexing progress)

#### 2.3 Knowledge Graph Layer (LightRAG-inspired)
**Files:** `agent-runtime/src/knowledge/graph.ts`
**Why:** Flat vector search misses relationships. "Which clients are in the food industry?" needs graph traversal.

**Requirements:**
- [ ] Entity extraction from knowledge documents (using LLM)
- [ ] Relationship extraction (entity A → relationship → entity B)
- [ ] Store in SQLite (nodes + edges tables)
- [ ] Graph-aware retrieval: vector search + graph traversal combined
- [ ] Incremental updates: new documents add to graph, don't rebuild
- [ ] Graph visualization in UI (optional, stretch goal)

### Phase 3: Tools & MCP (HIGH)

#### 3.1 Enhanced MCP Server Management
**Files:** `agent-runtime/src/mcp/manager.ts`, `agent-runtime/src/mcp/discovery.ts`
**Why:** MCP is the universal tool standard. Need better lifecycle management.

**Requirements:**
- [ ] MCP server lifecycle: start, stop, restart, health check
- [ ] Pre-configured MCP servers per agent in manifests
- [ ] MCP server discovery: browse available servers from registry
- [ ] Server config UI: add/remove/configure MCP servers
- [ ] Error recovery: auto-restart crashed MCP servers
- [ ] Resource/prompt support (not just tools)

#### 3.2 Composio Integration
**Files:** `agent-runtime/src/tools/composio.ts`
**Why:** 1000+ pre-authenticated API integrations. Social media APIs, analytics, CRM.

**Requirements:**
- [ ] Composio SDK integration (TypeScript)
- [ ] Pre-configured actions for social media: Meta, TikTok, YouTube, LinkedIn, X
- [ ] OAuth flow management through Composio
- [ ] Action filtering: only expose relevant tools to each agent
- [ ] Usage tracking per action

#### 3.3 Dynamic Tool Selection
**Files:** `agent-runtime/src/skills/selector.ts`
**Why:** With 100+ tools available, agents need smart selection, not all-tools-every-time.

**Requirements:**
- [ ] Tool relevance scoring based on user message
- [ ] Max tools per turn (e.g., top 20 most relevant)
- [ ] Tool usage history: prefer tools that worked well before
- [ ] Tool groups: "social-media-posting", "analytics", "content-creation"

### Phase 4: Context Engineering (MEDIUM)

#### 4.1 Context Manager
**Files:** `agent-runtime/src/context/manager.ts`
**Why:** Context window is the most valuable resource. Need to manage it intelligently.

**Requirements:**
- [ ] Token budget allocation:
  - System prompt: 20%
  - Working memory: 10%
  - Retrieved knowledge: 20%
  - Conversation history: 40%
  - Tool definitions: 10%
- [ ] Dynamic compression: summarize older messages when approaching limits
- [ ] Priority-based inclusion: more relevant memories/knowledge get more tokens
- [ ] Context window tracking: show token usage in UI
- [ ] XML-structured prompt sections (GSD pattern)

#### 4.2 Modular Skill Files (SKILL.md)
**Files:** `agents/*/skills/*.md`
**Why:** Modular, composable prompt components per capability.

**Requirements:**
- [ ] SKILL.md format: name, description, trigger conditions, prompt injection, tools required
- [ ] Dynamic loading: only load skills relevant to current task
- [ ] Skill composition: multiple skills can activate per turn
- [ ] Community skill format compatible with OpenAI Skills / Superpowers patterns

### Phase 5: Conversation Persistence (MEDIUM)

#### 5.1 Persistent Conversations
**Files:** `agent-runtime/src/memory/conversations.ts`
**Why:** Conversations currently lost on restart.

**Requirements:**
- [ ] SQLite table for conversations (id, agentId, title, messages, createdAt, updatedAt)
- [ ] Auto-save after each turn
- [ ] Conversation list in sidebar
- [ ] Resume conversation on app restart
- [ ] Conversation search
- [ ] Export conversations (markdown, JSON)
- [ ] Conversation branching (fork from any point)

### Phase 6: Eval & Observability (MEDIUM)

#### 6.1 Agent Evaluation Framework
**Files:** `agent-runtime/src/eval/`
**Why:** Can't improve what you can't measure.

**Requirements:**
- [ ] Per-turn quality scoring (relevance, helpfulness, accuracy)
- [ ] Tool use efficiency: did it use the right tools? Too many calls?
- [ ] Knowledge retrieval quality: were the right chunks found?
- [ ] Cost efficiency: tokens used vs value delivered
- [ ] A/B testing: same prompt, different models, compare outputs
- [ ] Eval dashboard in UI

#### 6.2 Observability & Analytics
**Files:** `agent-runtime/src/telemetry/`
**Why:** Need to know what's happening inside the agent.

**Requirements:**
- [ ] Token usage tracking per conversation, per agent, per model
- [ ] Cost tracking (per provider pricing)
- [ ] Latency tracking (time to first token, total response time)
- [ ] Tool call success/failure rates
- [ ] Daily/weekly/monthly usage reports
- [ ] Export analytics (CSV/JSON)

### Phase 7: Frontend Upgrades (MEDIUM)

#### 7.1 Model Selector UI
**Requirements:**
- [ ] Dropdown in top bar to switch active model
- [ ] Show current provider + model name
- [ ] Show cost estimate per message
- [ ] Subscription badge for unlimited providers

#### 7.2 Memory Inspector
**Requirements:**
- [ ] View extracted memories per agent/client
- [ ] Edit/delete memories
- [ ] Search memories
- [ ] Memory confidence indicators

#### 7.3 Knowledge Browser
**Requirements:**
- [ ] Browse indexed knowledge per agent
- [ ] Search knowledge base
- [ ] Add new documents (drag & drop)
- [ ] View indexing status

#### 7.4 Analytics Dashboard
**Requirements:**
- [ ] Token usage charts (daily, by agent, by model)
- [ ] Cost tracking charts
- [ ] Agent performance metrics
- [ ] Most used tools

#### 7.5 Conversation Management
**Requirements:**
- [ ] Persistent conversation list in sidebar
- [ ] Conversation search
- [ ] Resume past conversations
- [ ] Delete/archive conversations

---

## 5. Updated Agent Manifest Schema (v2)

```json
{
  "id": "seo",
  "name": "SEO Agent",
  "version": "2.0.0",
  "description": "Technical SEO audits, content optimization, and search strategy",
  "icon": "🔍",
  "category": "marketing",
  "model": {
    "providers": [
      {
        "provider": "anthropic",
        "primary": "claude-opus-4",
        "fast": "claude-haiku-4-5",
        "priority": 1
      },
      {
        "provider": "openai",
        "primary": "gpt-4.1",
        "fast": "gpt-4.1-mini",
        "priority": 2
      },
      {
        "provider": "ollama",
        "primary": "llama3.2:8b",
        "fast": "llama3.2:3b",
        "priority": 3
      }
    ],
    "routing": {
      "preferSubscription": true,
      "fallbackChain": true
    }
  },
  "systemPrompt": "...",
  "knowledge": ["knowledge/"],
  "skills": ["web-crawl", "screenshot", "http-request", "file-write", "web-search"],
  "skillFiles": ["skills/technical-audit.md", "skills/keyword-research.md"],
  "mcpServers": [
    { "name": "search-console", "command": "npx", "args": ["search-console-mcp"] },
    { "name": "filesystem", "command": "npx", "args": ["@modelcontextprotocol/server-filesystem", "."] }
  ],
  "memory": {
    "workingMemorySize": 4096,
    "extractFacts": true,
    "entityTypes": ["client", "website", "keyword"]
  },
  "context": {
    "maxTokens": 128000,
    "budgetAllocation": {
      "system": 0.20,
      "workingMemory": 0.10,
      "knowledge": 0.20,
      "history": 0.40,
      "tools": 0.10
    }
  },
  "roles": ["admin", "developer"],
  "guardrails": {
    "maxTokensPerTurn": 8000,
    "maxToolLoops": 20,
    "allowedDomains": ["*"],
    "dailyTokenBudget": 500000
  }
}
```

---

## 6. Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-provider | OpenAI SDK + Anthropic SDK + google-genai + ollama REST | Native SDKs for best compatibility |
| Embeddings | Ollama (nomic-embed-text) + ONNX fallback | Local, fast, no API cost |
| Vector DB | LanceDB | Embedded, hybrid search, TypeScript SDK, no server |
| Memory extraction | LLM-based (Haiku/Flash) | Most accurate, cost-effective at fast tier |
| Knowledge graph | SQLite (nodes/edges) | Simple, embedded, sufficient for agency scale |
| Context management | Custom token budgeting | Tailored to agent architecture needs |
| Durability | SQLite checkpoints | Already have SQLite, minimal new deps |
| Eval | Custom + LLM-as-judge | Lightweight, no external service needed |

---

## 7. New Dependencies

```json
{
  "openai": "^4.x",
  "@google/generative-ai": "^0.x",
  "@lancedb/lancedb": "^0.x",
  "composio-core": "^0.x",
  "apache-arrow": "^17.x"
}
```

---

## 8. File Structure (New/Modified)

```
agent-runtime/src/
├── llm/
│   ├── client.ts              (REFACTOR → abstract interface)
│   ├── router.ts              (REWRITE → multi-signal routing)
│   ├── cost-tracker.ts        (NEW)
│   └── providers/
│       ├── anthropic.ts       (NEW — extracted from client.ts)
│       ├── openai.ts          (NEW)
│       ├── gemini.ts          (NEW)
│       ├── ollama.ts          (NEW)
│       └── openrouter.ts      (NEW)
├── agent/
│   ├── runtime.ts             (MAJOR REFACTOR — durable execution)
│   ├── checkpoint.ts          (NEW)
│   ├── context.ts             (REFACTOR — token budgeting)
│   └── loader.ts              (UPDATE — v2 manifest schema)
├── memory/
│   ├── store.ts               (KEEP — base SQLite)
│   ├── structured.ts          (NEW — Mem0-style extraction)
│   ├── extractor.ts           (NEW — fact extraction via LLM)
│   ├── working.ts             (NEW — editable working memory)
│   ├── conversations.ts       (NEW — persistent conversations)
│   └── summarizer.ts          (KEEP)
├── knowledge/
│   ├── embedder.ts            (REWRITE — Ollama/ONNX embeddings)
│   ├── lancedb.ts             (NEW — LanceDB integration)
│   ├── graph.ts               (NEW — knowledge graph)
│   ├── search.ts              (REWRITE — hybrid search)
│   └── loader.ts              (UPDATE — incremental indexing)
├── tools/
│   ├── composio.ts            (NEW)
│   └── selector.ts            (NEW — dynamic tool selection)
├── context/
│   └── manager.ts             (NEW — context budget management)
├── eval/
│   ├── scorer.ts              (NEW)
│   ├── tracker.ts             (NEW)
│   └── reporter.ts            (NEW)
├── telemetry/
│   ├── usage.ts               (NEW)
│   ├── cost.ts                (NEW)
│   └── latency.ts             (NEW)
├── mcp/
│   ├── client.ts              (KEEP)
│   ├── registry.ts            (KEEP)
│   ├── manager.ts             (NEW — lifecycle management)
│   └── discovery.ts           (NEW — server discovery)
├── skills/
│   ├── registry.ts            (KEEP)
│   ├── executor.ts            (KEEP)
│   ├── selector.ts            (NEW — dynamic selection)
│   └── builtin/               (UPDATE — add memory skills)
│       ├── memory-read.ts     (NEW)
│       ├── memory-write.ts    (NEW)
│       ├── memory-delete.ts   (NEW)
│       └── memory-list.ts     (NEW)
└── rpc/
    ├── router.ts              (UPDATE — new methods)
    ├── server.ts              (KEEP)
    └── types.ts               (UPDATE — new types)

src/ (React frontend)
├── components/
│   ├── chat/
│   │   └── ModelSelector.tsx  (NEW)
│   ├── memory/
│   │   └── MemoryInspector.tsx (NEW)
│   ├── knowledge/
│   │   └── KnowledgeBrowser.tsx (NEW)
│   ├── analytics/
│   │   └── Dashboard.tsx      (NEW)
│   └── settings/
│       └── ProviderConfig.tsx (NEW)
└── stores/
    ├── modelStore.ts          (NEW)
    └── analyticsStore.ts      (NEW)
```

---

## 9. Implementation Order

**Spawn Order for Sub-agents (Ralph Loop):**

1. **Agent 1: LLM Provider System** — Multi-provider client, router v2, cost tracking
2. **Agent 2: Memory System** — Structured memory, working memory, fact extraction, conversation persistence
3. **Agent 3: Knowledge Engine** — LanceDB, real embeddings, hybrid search, knowledge graph
4. **Agent 4: Context & Durability** — Context manager, checkpointing, durable execution
5. **Agent 5: Tools & MCP** — Enhanced MCP manager, Composio, dynamic tool selection
6. **Agent 6: Eval & Telemetry** — Quality scoring, cost tracking, usage analytics
7. **Agent 7: Frontend** — Model selector, memory inspector, knowledge browser, analytics dashboard, conversation persistence
8. **Agent 8: Integration & QA** — Wire everything together, full test pass, manifest v2 migration

---

## 10. Success Criteria

- [ ] User can switch between Claude, GPT, Gemini, and Ollama mid-conversation
- [ ] Agent automatically remembers client preferences across sessions
- [ ] Knowledge search returns relevant results (not bag-of-words garbage)
- [ ] App survives crash and resumes where it left off
- [ ] Token usage and costs visible in real-time
- [ ] All 5 agents work with upgraded architecture
- [ ] `npm run tauri dev` runs without errors
- [ ] `tsc --noEmit` passes
- [ ] `cargo build` succeeds
- [ ] All existing functionality preserved (no regressions)

---

## 11. Cost Strategy

**The Subscription Play:**
- Anthropic Max ($200/mo): Unlimited Claude Opus/Sonnet
- ChatGPT Pro ($200/mo): Unlimited GPT-4.1/o3
- Gemini Advanced ($20/mo): Unlimited Gemini 2.5 Pro
- Ollama: Free (local)

Users configure which subscriptions they have. Router prefers subscription providers to minimize per-token API costs. API keys remain as fallback for burst/overflow.

This means a user paying $200/mo for Anthropic Max can use Opus all day without worrying about cost. The router detects this and stops cost-optimizing, just uses the best model.

---

*This PRD is the source of truth. All sub-agents reference it. All code follows it.*
