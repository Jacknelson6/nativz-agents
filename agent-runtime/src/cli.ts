#!/usr/bin/env node
import * as path from "node:path";
import * as readline from "node:readline";
import { AgentRuntime } from "./agent/runtime.js";
import { listAgents } from "./agent/loader.js";

const agentsDir = path.resolve(import.meta.dirname ?? __dirname, "../../agents");

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--list") {
      args.list = true;
    } else if (argv[i] === "--agent" && argv[i + 1]) {
      args.agent = argv[++i];
    } else if (argv[i] === "--message" && argv[i + 1]) {
      args.message = argv[++i];
    }
  }
  return args;
}

async function listAllAgents() {
  const agents = await listAgents(agentsDir);
  if (agents.length === 0) {
    console.log("No agents found.");
    return;
  }
  console.log("\n📋 Available Agents:\n");
  for (const a of agents) {
    console.log(`  ${a.id ?? a.name}`);
    console.log(`    Name: ${a.name}`);
    console.log(`    ${a.description}\n`);
  }
}

async function runAgent(agentId: string, message?: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌ ANTHROPIC_API_KEY environment variable is required.");
    process.exit(1);
  }

  const rt = new AgentRuntime(apiKey);
  const manifestPath = path.join(agentsDir, agentId, "manifest.json");

  try {
    const manifest = await rt.loadAgent(manifestPath);
    console.log(`\n🤖 ${manifest.name}\n`);
  } catch (err) {
    console.error(`❌ Failed to load agent "${agentId}":`, err);
    process.exit(1);
  }

  if (message) {
    // Single message mode
    const response = await rt.sendMessage(message, "cli-user", (type, data) => {
      if (type === "text_delta" && data.text) {
        process.stdout.write(data.text as string);
      }
    });
    // If streaming didn't print, print the full response
    if (!response) console.log(response);
    console.log();
    await rt.shutdown();
    process.exit(0);
  }

  // REPL mode
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question("\n> ", async (input) => {
      const trimmed = input.trim();
      if (!trimmed || trimmed === "exit" || trimmed === "quit") {
        console.log("Goodbye!");
        await rt.shutdown();
        rl.close();
        process.exit(0);
      }

      try {
        await rt.sendMessage(trimmed, "cli-user", (type, data) => {
          if (type === "text_delta" && data.text) {
            process.stdout.write(data.text as string);
          }
        });
        console.log();
      } catch (err) {
        console.error("\n❌ Error:", err);
      }
      prompt();
    });
  };

  console.log('Type your message (or "exit" to quit):');
  prompt();
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.list) {
    await listAllAgents();
  } else if (args.agent) {
    await runAgent(args.agent as string, args.message as string | undefined);
  } else {
    console.log(`
Nativz Agents CLI

Usage:
  npx tsx src/cli.ts --list                          List available agents
  npx tsx src/cli.ts --agent <id>                    Interactive REPL
  npx tsx src/cli.ts --agent <id> --message "..."    Single message

Requires ANTHROPIC_API_KEY environment variable.
`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
