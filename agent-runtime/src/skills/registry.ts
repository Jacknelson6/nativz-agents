import { z, type ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Tool } from "@anthropic-ai/sdk/resources/messages.js";

export interface SkillDefinition {
  name: string;
  description: string;
  parameters: ZodType;
  execute: (params: Record<string, unknown>) => Promise<string>;
  group?: string;
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

  getByGroup(group: string): SkillDefinition[] {
    return this.list().filter((s) => s.group === group);
  }

  search(query: string): SkillDefinition[] {
    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    if (terms.length === 0) return this.list();

    const scored = this.list().map((skill) => {
      const text = `${skill.name} ${skill.description}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (text.includes(term)) score++;
      }
      return { skill, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.skill);
  }

  toClaudeTools(filter?: string[]): Tool[] {
    const skills = filter
      ? this.list().filter((s) => filter.includes(s.name))
      : this.list();

    return skills.map((skill) => {
      const jsonSchema = zodToJsonSchema(skill.parameters, { target: "openApi3" });
      // Sanitize tool name: Claude requires ^[a-zA-Z0-9_-]{1,128}$
      const sanitizedName = skill.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
      return {
        name: sanitizedName,
        description: skill.description,
        input_schema: jsonSchema as Tool["input_schema"],
      };
    });
  }
}
