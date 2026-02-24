import type { SkillRegistry } from "./registry.js";

const DEFAULT_SKILL_TIMEOUT_MS = 60_000; // 60 seconds

export class SkillExecutor {
  private timeoutMs: number;

  constructor(private registry: SkillRegistry, timeoutMs?: number) {
    this.timeoutMs = timeoutMs ?? DEFAULT_SKILL_TIMEOUT_MS;
  }

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
      return await this.executeWithTimeout(
        () => skill.execute(parsed.data as Record<string, unknown>),
        name
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return JSON.stringify({ error: `Skill execution failed: ${message}` });
    }
  }

  private executeWithTimeout(
    fn: () => Promise<string>,
    skillName: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Skill '${skillName}' timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}
