import type { SkillRegistry, SkillExecutionContext } from "./registry.js";

const DEFAULT_SKILL_TIMEOUT_MS = 60_000; // 60 seconds
const BROWSER_SKILL_TIMEOUT_MS = 180_000; // 3 minutes for browser-based skills

const BROWSER_SKILLS = new Set([
  "browser-interact",
  "browse-page",
  "web-crawl",
  "screenshot",
]);

export class SkillExecutor {
  private timeoutMs: number;

  constructor(private registry: SkillRegistry, timeoutMs?: number) {
    this.timeoutMs = timeoutMs ?? DEFAULT_SKILL_TIMEOUT_MS;
  }

  async execute(name: string, params: Record<string, unknown>, context?: SkillExecutionContext): Promise<string> {
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
        () => skill.execute(parsed.data as Record<string, unknown>, context),
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
      const effectiveTimeout = BROWSER_SKILLS.has(skillName)
        ? Math.max(this.timeoutMs, BROWSER_SKILL_TIMEOUT_MS)
        : this.timeoutMs;
      const timer = setTimeout(() => {
        reject(new Error(`Skill '${skillName}' timed out after ${effectiveTimeout}ms`));
      }, effectiveTimeout);

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
