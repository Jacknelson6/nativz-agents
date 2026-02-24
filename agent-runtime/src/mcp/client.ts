import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverName: string;
}

export class McpClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  public name: string;

  constructor(name: string) {
    this.name = name;
    this.client = new Client({ name: "agent-runtime", version: "0.1.0" }, {});
  }

  async connect(config: McpServerConfig): Promise<void> {
    this.transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: config.env,
    });
    await this.client.connect(this.transport);
  }

  async listTools(): Promise<McpTool[]> {
    const result = await this.client.listTools();
    return result.tools.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      inputSchema: t.inputSchema as Record<string, unknown>,
      serverName: this.name,
    }));
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    const result = await this.client.callTool({ name, arguments: args });
    const content = result.content as Array<{ type: string; text?: string }>;
    return content.map((c) => c.text ?? JSON.stringify(c)).join("\n");
  }

  async disconnect(): Promise<void> {
    await this.transport?.close();
  }
}
