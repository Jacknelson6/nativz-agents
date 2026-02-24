#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Nativz Agents — Beta Test Runner
# Starts the app in dev mode and prints a test checklist
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ── Colors ──
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      Nativz Agents — Beta Test Runner           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Preflight checks ──
echo -e "${YELLOW}[1/5] Preflight checks...${NC}"

# Node
if ! command -v node &>/dev/null; then
  echo -e "  ${RED}✗ node not found${NC}"; exit 1
fi
echo -e "  ${GREEN}✓${NC} node $(node -v)"

# Rust / cargo
if ! command -v cargo &>/dev/null; then
  echo -e "  ${RED}✗ cargo not found (required for Tauri)${NC}"
  echo "    Install: https://www.rust-lang.org/tools/install"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} cargo $(cargo --version | cut -d' ' -f2)"

# npm
if ! command -v npm &>/dev/null; then
  echo -e "  ${RED}✗ npm not found${NC}"; exit 1
fi
echo -e "  ${GREEN}✓${NC} npm $(npm -v)"

# ── 2. Check env ──
echo ""
echo -e "${YELLOW}[2/5] Checking environment...${NC}"

ENV_FILE="$ROOT/agent-runtime/.env"
if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$ROOT/.env" ]; then
    echo -e "  ${GREEN}✓${NC} Found .env at project root"
    echo "  Symlinking to agent-runtime/.env"
    ln -sf "$ROOT/.env" "$ENV_FILE"
  else
    echo -e "  ${YELLOW}⚠ No .env file found${NC}"
    echo "    Copy .env.example → .env and add at least ANTHROPIC_API_KEY"
    echo ""
    echo -e "    ${CYAN}cp .env.example .env && \$EDITOR .env${NC}"
    echo ""
    read -p "  Continue without .env? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi
  fi
else
  echo -e "  ${GREEN}✓${NC} agent-runtime/.env exists"
fi

# Check if API key is configured in settings or env
HAS_KEY=false
if [ -f "$ROOT/.env" ] && grep -q "ANTHROPIC_API_KEY=sk-" "$ROOT/.env" 2>/dev/null; then
  HAS_KEY=true
  echo -e "  ${GREEN}✓${NC} ANTHROPIC_API_KEY set in .env"
elif [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  HAS_KEY=true
  echo -e "  ${GREEN}✓${NC} ANTHROPIC_API_KEY set in environment"
else
  echo -e "  ${YELLOW}⚠ No ANTHROPIC_API_KEY found — set it in .env or Settings UI${NC}"
fi

# ── 3. Install deps ──
echo ""
echo -e "${YELLOW}[3/5] Installing dependencies...${NC}"

cd "$ROOT"
if [ ! -d "node_modules" ]; then
  echo "  Installing root dependencies..."
  npm install --silent
else
  echo -e "  ${GREEN}✓${NC} Root node_modules exist"
fi

cd "$ROOT/agent-runtime"
if [ ! -d "node_modules" ]; then
  echo "  Installing agent-runtime dependencies..."
  npm install --legacy-peer-deps --silent
else
  echo -e "  ${GREEN}✓${NC} agent-runtime node_modules exist"
fi

# ── 4. Quick build check ──
echo ""
echo -e "${YELLOW}[4/5] Quick build check...${NC}"

cd "$ROOT"
echo "  TypeScript check (agent-runtime)..."
cd "$ROOT/agent-runtime"
if ./node_modules/.bin/tsc --noEmit 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} agent-runtime tsc clean"
else
  echo -e "  ${RED}✗ agent-runtime has type errors${NC}"
fi

cd "$ROOT"
echo "  Vite build..."
if npx vite build --logLevel error 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Frontend builds"
else
  echo -e "  ${RED}✗ Frontend build failed${NC}"
fi

echo "  Unit tests..."
cd "$ROOT"
if npm test 2>/dev/null | tail -1 | grep -q "pass"; then
  echo -e "  ${GREEN}✓${NC} All tests pass"
else
  echo -e "  ${RED}✗ Some tests failed${NC}"
fi

# ── 5. Print checklist & start ──
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  BETA TEST CHECKLIST${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}STARTUP${NC}"
echo "  [ ] App window opens (1200x800)"
echo "  [ ] No crash on launch"
echo "  [ ] Sidecar starts (check terminal for '[sidecar]' logs)"
echo "  [ ] 'agent-runtime: RPC server started' appears in terminal"
echo ""
echo -e "  ${YELLOW}AGENT SELECTION${NC}"
echo "  [ ] Sidebar shows all 5 agents (DIY, SEO, Ads, Content Editor, Account Manager)"
echo "  [ ] Each agent shows icon and name"
echo "  [ ] Clicking an agent loads the chat view"
echo ""
echo -e "  ${YELLOW}STATUS BAR${NC}"
echo "  [ ] Bottom status bar appears"
echo "  [ ] Shows model name (e.g. 'Claude Sonnet 4')"
echo "  [ ] Shows provider name"
echo "  [ ] Health dot is green (healthy) after a few seconds"
echo "  [ ] Token count starts at 0"
echo "  [ ] Cost shows <\$0.01"
echo ""
echo -e "  ${YELLOW}CHAT — BASIC${NC}"
echo "  [ ] Type a message and press Enter"
echo "  [ ] 'typing...' indicator appears"
echo "  [ ] Response streams in (text appears incrementally)"
echo "  [ ] Message bubble renders with markdown"
echo "  [ ] Token count in status bar increases"
echo "  [ ] Cost estimate updates"
echo ""
echo -e "  ${YELLOW}CHAT — TOOL USE${NC}"
echo "  [ ] Ask: 'Search the web for the latest news about AI'"
echo "  [ ] Tool use indicator shows (web-search running)"
echo "  [ ] Tool completes and response includes search results"
echo "  [ ] No hanging — response completes within 60s"
echo ""
echo -e "  ${YELLOW}SETTINGS${NC}"
echo "  [ ] Open Settings (gear icon or Cmd+,)"
echo "  [ ] API key field shows (masked)"
echo "  [ ] Can save/change API key"
echo "  [ ] Theme toggle works (dark/light)"
echo ""
echo -e "  ${YELLOW}ANALYTICS${NC}"
echo "  [ ] Navigate to Analytics/Dashboard"
echo "  [ ] Shows 'Monthly Tokens' stat card"
echo "  [ ] Shows 'Today's Cost' and 'Monthly Cost'"
echo "  [ ] Shows 'Budget Status' (On Track / Over Budget)"
echo "  [ ] By Agent / By Model breakdowns render"
echo "  [ ] Cost Calculator loads without errors"
echo ""
echo -e "  ${YELLOW}CONVERSATIONS${NC}"
echo "  [ ] Send a few messages, then switch agents"
echo "  [ ] Switch back — history is preserved"
echo "  [ ] Conversation list in sidebar shows entries"
echo ""
echo -e "  ${YELLOW}EDGE CASES${NC}"
echo "  [ ] Send empty message — nothing happens (disabled)"
echo "  [ ] Rapidly click send — no double-sends while streaming"
echo "  [ ] Close & reopen app — settings persist"
echo "  [ ] Remove API key in settings — error message on send"
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Starting Tauri dev mode...${NC}"
echo -e "  Cmd: ${CYAN}npm run dev${NC}"
echo -e "  Frontend: ${CYAN}http://localhost:1420${NC}"
echo ""
echo -e "  ${YELLOW}Tip:${NC} Watch this terminal for sidecar logs."
echo -e "  ${YELLOW}Tip:${NC} Open DevTools in the app with Cmd+Option+I"
echo ""

cd "$ROOT"
npm run dev
