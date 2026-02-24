import { z, type ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Tool } from "@anthropic-ai/sdk/resources/messages.js";

export interface SkillDefinition {
  name: string;
  description: string;
  parameters: ZodType;
  execute: (params: Record<string, unknown>) => Promise<string>;
}

export class SkillRegistry {
  private skills = new Map<string, SkillDefinition>();

  register(skill: SkillDefinition): void {
    this.skills.set(skill.name, skill);
  }

  get(name: string): SkillDefinition | undefined {
    return this.skills.get(name);
  }

  has(name: string): boolean {
    return this.skills.has(name);
  }

  list(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  listNames(): string[] {
    return Array.from(this.skills.keys());
  }

  toClaudeTools(filter?: string[]): Tool[] {
    const skills = filter
      ? this.list().filter((s) => filter.includes(s.name))
      : this.list();

    return skills.map((skill) => {
      const jsonSchema = zodToJsonSchema(skill.parameters, { target: "openApi3" });
      return {
        name: skill.name,
        description: skill.description,
        input_schema: jsonSchema as Tool["input_schema"],
      };
    });
  }
}
