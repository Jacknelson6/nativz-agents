# Nativz Agents

Pre-built AI agents for social media teams. Download, pick an agent, start working.

## What is this?

A native desktop app that gives your team access to specialized AI agents. Each agent comes pre-loaded with expert knowledge, tools, and masterfully engineered prompts. No training, no configuration — works day one.

## Agents

| Agent | Description |
|-------|-------------|
| 🔍 **SEO Agent** | Technical audits, keyword research, content optimization, search strategy |
| 📢 **Ads Agent** | Campaign setup, budget optimization, Meta/Google/TikTok Ads |
| ✂️ **Content Editor** | Editing briefs, captions, content scheduling, trend analysis |
| 📊 **Account Manager** | Client reports, meeting prep, project management |
| 🛠️ **DIY Agent** | Build your own — add custom knowledge and skills |

## Tech Stack

- **Desktop**: Tauri v2 (Rust + React)
- **AI**: Anthropic Claude (Opus + Haiku)
- **Tools**: MCP Protocol + built-in skills
- **Browser**: Stagehand + Playwright
- **Knowledge**: LanceDB + local embeddings
- **Memory**: SQLite

## Development

```bash
# Install dependencies
npm install
cd agent-runtime && npm install && cd ..

# Run in development
npm run tauri dev

# Build for production
npm run tauri build
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full technical details.
