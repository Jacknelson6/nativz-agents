<div align="center">

# 🤖 Nativz Agents

**AI-powered desktop app for marketing teams. Specialized agents for SEO, paid media, social, content, analytics, and development — all running locally with Tauri v2.**

[![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri%20v2-blue?logo=tauri)](https://tauri.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📸 Screenshots

> *Coming soon — the app features a dark-themed chat interface with agent picker sidebar, real-time streaming responses, tool execution visualization, and an analytics dashboard.*

---

## ✨ Features

### 🎯 Specialized AI Agents
- **SEO Agent** — Site audits, keyword research, content optimization
- **Paid Media Agent** — Campaign creation, budget allocation, ad copy
- **Social Media Agent** — Content scheduling, trend analysis, engagement
- **Content Agent** — Blog posts, newsletters, copywriting
- **Analytics Agent** — Data analysis, dashboards, reporting
- **Developer Agent** — Code review, debugging, CI/CD setup

### 🧠 Intelligent Runtime
- **Multi-provider support** — OpenAI, Anthropic, Google Gemini, Ollama (local), OpenRouter
- **Smart routing** — Automatically selects the best model for each task
- **Cost tracking** — Real-time token usage and budget monitoring
- **Memory system** — Persistent memory with entity graphs and working memory
- **Knowledge base** — Hybrid vector + BM25 search with LanceDB
- **Tool execution** — MCP integration, browser automation, web search

### 🛡️ Reliability
- **Error recovery** — Automatic retry with backoff, circuit breakers, provider fallback
- **Guardrails** — PII detection, content policy, input/output validation
- **Checkpointing** — Resume interrupted conversations
- **Conversation export** — Share-ready HTML reports

### 🖥️ Desktop Experience
- **Native performance** — Built with Tauri v2 (Rust backend)
- **Dark theme** — Beautiful, purpose-built UI
- **Keyboard shortcuts** — Command palette (`⌘K`) for power users
- **Auto-updates** — Notifies when new versions are available
- **Offline capable** — Works with local Ollama models

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) (for Tauri)
- An API key from OpenAI, Anthropic, or another supported provider

### Install & Run

```bash
# Clone the repo
git clone https://github.com/nativz/nativz-agents.git
cd nativz-agents

# Install dependencies
npm install
cd agent-runtime && npm install && cd ..

# Run in development
npm run tauri dev
```

### Configure
1. Open the app → **Settings** (gear icon)
2. Enter your API key (OpenAI, Anthropic, etc.)
3. Pick an agent and start chatting

---

## 🏗️ Architecture

```
nativz-agents/
├── src/                    # React frontend (Vite + Tailwind)
│   ├── components/         # UI components (chat, layout, settings)
│   ├── stores/             # Zustand state management
│   └── lib/                # Types, Tauri bridge, utilities
├── agent-runtime/          # TypeScript agent engine
│   └── src/
│       ├── agent/          # Core runtime, planning, error recovery
│       ├── llm/            # Provider registry, routing, cost tracking
│       ├── memory/         # Persistent + working memory, conversations
│       ├── knowledge/      # Vector search, embeddings, reranking
│       ├── skills/         # Tool registry, selection, execution
│       ├── mcp/            # Model Context Protocol integration
│       └── browser/        # Browser automation (Stagehand)
├── src-tauri/              # Rust backend (Tauri v2)
└── agents/                 # Agent manifest YAML files
```

For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Rust toolchain (`rustup`)
- Recommended: VS Code with Tauri + TypeScript extensions

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run tauri dev` | Start full Tauri app in dev mode |
| `npm run build` | Build frontend |
| `npm run tauri build` | Build distributable app |
| `cd agent-runtime && npx tsc --noEmit` | Type-check agent runtime |
| `npx tsx --test agent-runtime/tests/runtime.test.ts` | Run tests |

### Project Structure
- **Frontend** — React 19, Zustand, Tailwind CSS 4, Lucide icons
- **Runtime** — Pure TypeScript, better-sqlite3, LanceDB
- **Desktop** — Tauri v2 with Rust commands for IPC

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://nativz.io">Nativz</a></sub>
</div>
