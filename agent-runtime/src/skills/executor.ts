import type { SkillRegistry } from "./registry.js";

export class SkillExecutor {
  constructor(private registry: SkillRegistry) {}

  async execute(name: string, params: Record<string, unknown>): Promise<string> {
    const skill = this.registry.get(name);
    if (!skill) {
      return JSON.stringify({ error: `Unknown skill: ${name}` });
    }

    const parsed = skill.parameters.safeParse(params);
    if (!parsed.success) {
      return JSON.stringify({
        error: "Invalid parameters",
        details: parsed.error.issues,
      });
    }

    try {
      return await skill.execute(parsed.data as Record<string, unknown>);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return JSON.stringify({ error: `Skill execution failed: ${message}` });
    }
  }
}
