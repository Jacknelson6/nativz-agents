import { McpClient, type McpServerConfig, type McpTool } from "./client.js";
import { z } from "zod";
import type { SkillDefinition } from "../skills/registry.js";

export class McpRegistry {
  private clients = new Map<string, McpClient>();
  private tools = new Map<string, { tool: McpTool; client: McpClient }>();

  async connectServer(name: string, config: McpServerConfig): Promise<void> {
    const client = new McpClient(name);
    await client.connect(config);
    this.clients.set(name, client);

    const tools = await client.listTools();
    for (const tool of tools) {
      this.tools.set(`${name}.${tool.name}`, { tool, client });
    }
  }

  async callTool(fullName: string, args: Record<string, unknown>): Promise<string> {
    const entry = this.tools.get(fullName);
    if (!entry) throw new Error(`MCP tool not found: ${fullName}`);
    return entry.client.callTool(entry.tool.name, args);
  }

  /**
   * Convert MCP tools to SkillDefinitions for merging into the skill registry.
   */
  toSkillDefinitions(): SkillDefinition[] {
    const skills: SkillDefinition[] = [];
    for (const [fullName, { tool, client }] of this.tools) {
      skills.push({
        name: fullName,
        description: tool.description,
        parameters: z.record(z.unknown()), // Accept any params, MCP server validates
        execute: async (params) => client.callTool(tool.name, params),
      });
    }
    return skills;
  }

  async disconnectAll(): Promise<void> {
    for (const client of this.clients.values()) {
      await client.disconnect();
    }
    this.clients.clear();
    this.tools.clear();
  }
}
