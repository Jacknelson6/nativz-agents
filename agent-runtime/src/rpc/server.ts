import * as readline from "node:readline";
import type { JsonRpcRequest } from "./types.js";
import { RpcRouter } from "./router.js";

export class RpcServer {
  constructor(public readonly router: RpcRouter) {}

  start(): void {
    const rl = readline.createInterface({ input: process.stdin, terminal: false });

    rl.on("line", async (line) => {
      if (!line.trim()) return;
      try {
        const request = JSON.parse(line) as JsonRpcRequest;
        const response = await this.router.handle(request);
        process.stdout.write(JSON.stringify(response) + "\n");
      } catch {
        const errorResponse = {
          jsonrpc: "2.0" as const,
          id: null as unknown as string,
          error: { code: -32700, message: "Parse error" },
        };
        process.stdout.write(JSON.stringify(errorResponse) + "\n");
      }
    });

    rl.on("close", () => {
      process.exit(0);
    });
  }
}
