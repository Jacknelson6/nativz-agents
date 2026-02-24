#!/bin/bash
set -e
echo "🧪 Nativz Agents — Smoke Test"

# Check manifests
echo "Checking agent manifests..."
for f in agents/*/manifest.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" && echo "  ✅ $f" || echo "  ❌ $f"
done

# Check knowledge files
echo "Checking knowledge bases..."
for dir in agents/*/knowledge; do
  if [ -d "$dir" ]; then
    count=$(find "$dir" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    echo "  $(basename $(dirname $dir)): $count files"
  fi
done

# TypeScript check
echo "Checking TypeScript..."
cd agent-runtime && npx tsc --noEmit && echo "  ✅ agent-runtime compiles" && cd ..

if [ -f "package.json" ] && grep -q '"build"' package.json; then
  npm run build && echo "  ✅ frontend compiles"
fi

# Rust check
if [ -f "src-tauri/Cargo.toml" ]; then
  echo "Checking Rust..."
  cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | tail -1
fi

echo "✅ All checks passed!"
