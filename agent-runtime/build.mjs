#!/usr/bin/env node
/**
 * Bundle agent-runtime into a single JS file for production .app distribution.
 * Native modules (better-sqlite3, playwright) are marked external and must
 * remain in node_modules. All pure-JS deps are inlined.
 */
import { build } from "esbuild";
import { rmSync, mkdirSync } from "node:fs";

const OUTDIR = "dist";

// Clean
rmSync(OUTDIR, { recursive: true, force: true });
mkdirSync(OUTDIR, { recursive: true });

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: `${OUTDIR}/index.mjs`,
  sourcemap: true,
  minify: false, // keep readable for debugging
  // Native/binary modules that can't be bundled
  external: [
    "better-sqlite3",
    "playwright",
    "@playwright/test",
    "@browserbasehq/stagehand",
    "@lancedb/lancedb",
    "apache-arrow",
  ],
  // Handle node: protocol imports
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

console.log("✓ agent-runtime bundled to dist/index.mjs");
