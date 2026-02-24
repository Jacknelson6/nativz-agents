/**
 * Task Planning Engine — decomposes complex tasks into executable subtask plans.
 */

export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface PlanStep {
  id: string;
  description: string;
  tools: string[];
  dependsOn: string[];
  status: StepStatus;
  result?: string;
  error?: string;
}

export interface Plan {
  goal: string;
  steps: PlanStep[];
  createdAt: string;
  completedAt?: string;
}

type LLMCallFn = (prompt: string) => Promise<string>;

type StepExecutor = (step: PlanStep) => Promise<string>;

const DECOMPOSE_PROMPT = `You are a task planning system. Decompose the following task into a set of sequential or parallel subtasks.

Return ONLY valid JSON matching this schema:
{
  "steps": [
    {
      "id": "step_1",
      "description": "What this step does",
      "tools": ["tool_name_if_needed"],
      "dependsOn": ["step_id_of_prerequisite"]
    }
  ]
}

Rules:
- Each step should be a concrete, actionable unit of work
- Use dependsOn to express ordering constraints (empty array if independent)
- tools should list likely tool/skill names needed (empty array if just reasoning)
- Keep steps focused: 2-8 steps for most tasks
- IDs must be unique strings like "step_1", "step_2", etc.

Task: `;

const REPLAN_PROMPT = `A step in the execution plan has failed. Replan the remaining steps.

Original goal: {goal}

Completed steps:
{completed}

Failed step:
{failed}

Remaining steps (not yet started):
{remaining}

Return ONLY valid JSON with the same schema as before — a new list of steps to replace the remaining ones. Adjust the plan based on the failure. Keep step IDs unique and different from completed ones.
`;

export class TaskPlanner {
  private currentPlan: Plan | null = null;

  getCurrentPlan(): Plan | null {
    return this.currentPlan;
  }

  async decompose(task: string, llmCall: LLMCallFn): Promise<Plan> {
    const raw = await llmCall(DECOMPOSE_PROMPT + task);
    const parsed = this.parseSteps(raw);

    const plan: Plan = {
      goal: task,
      steps: parsed.map((s) => ({
        ...s,
        status: "pending" as StepStatus,
      })),
      createdAt: new Date().toISOString(),
    };

    this.currentPlan = plan;
    return plan;
  }

  async executePlan(
    plan: Plan,
    executor: StepExecutor,
    llmCall: LLMCallFn,
    onStepChange?: (step: PlanStep, plan: Plan) => void
  ): Promise<Plan> {
    this.currentPlan = plan;

    const maxIterations = plan.steps.length * 2;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;

      const readySteps = plan.steps.filter(
        (s) =>
          s.status === "pending" &&
          s.dependsOn.every((depId) => {
            const dep = plan.steps.find((d) => d.id === depId);
            return dep?.status === "completed" || dep?.status === "skipped";
          })
      );

      if (readySteps.length === 0) break;

      for (const step of readySteps) {
        step.status = "running";
        onStepChange?.(step, plan);

        try {
          const result = await executor(step);
          step.status = "completed";
          step.result = result;
          onStepChange?.(step, plan);
        } catch (err) {
          step.status = "failed";
          step.error = err instanceof Error ? err.message : String(err);
          onStepChange?.(step, plan);

          // Attempt replanning for remaining steps
          const replanSuccess = await this.replan(plan, step, llmCall);
          if (!replanSuccess) {
            // Skip dependent steps
            this.skipDependents(plan, step.id);
          }
        }
      }
    }

    plan.completedAt = new Date().toISOString();
    return plan;
  }

  private async replan(plan: Plan, failedStep: PlanStep, llmCall: LLMCallFn): Promise<boolean> {
    const completed = plan.steps
      .filter((s) => s.status === "completed")
      .map((s) => `- ${s.id}: ${s.description} (result: ${s.result ?? "ok"})`)
      .join("\n");

    const remaining = plan.steps
      .filter((s) => s.status === "pending")
      .map((s) => `- ${s.id}: ${s.description}`)
      .join("\n");

    if (!remaining) return false;

    const prompt = REPLAN_PROMPT
      .replace("{goal}", plan.goal)
      .replace("{completed}", completed || "None")
      .replace("{failed}", `${failedStep.id}: ${failedStep.description} — Error: ${failedStep.error ?? "unknown"}`)
      .replace("{remaining}", remaining);

    try {
      const raw = await llmCall(prompt);
      const newSteps = this.parseSteps(raw);

      // Remove old pending steps, add new ones
      plan.steps = [
        ...plan.steps.filter((s) => s.status !== "pending"),
        ...newSteps.map((s) => ({ ...s, status: "pending" as StepStatus })),
      ];

      return true;
    } catch {
      return false;
    }
  }

  private skipDependents(plan: Plan, failedId: string): void {
    for (const step of plan.steps) {
      if (step.status === "pending" && step.dependsOn.includes(failedId)) {
        step.status = "skipped";
        step.error = `Skipped: dependency ${failedId} failed`;
        this.skipDependents(plan, step.id);
      }
    }
  }

  private parseSteps(raw: string): Array<Omit<PlanStep, "status">> {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as {
      steps: Array<{
        id: string;
        description: string;
        tools?: string[];
        dependsOn?: string[];
      }>;
    };

    return parsed.steps.map((s) => ({
      id: s.id,
      description: s.description,
      tools: s.tools ?? [],
      dependsOn: s.dependsOn ?? [],
    }));
  }

  serializeForContext(): string {
    if (!this.currentPlan) return "";

    const stepLines = this.currentPlan.steps
      .map((s) => {
        const statusIcon =
          s.status === "completed" ? "✓" :
          s.status === "running" ? "▶" :
          s.status === "failed" ? "✗" :
          s.status === "skipped" ? "⊘" : "○";
        return `  ${statusIcon} [${s.id}] ${s.description} (${s.status})`;
      })
      .join("\n");

    return `<current_plan goal="${escapeXml(this.currentPlan.goal)}">\n${stepLines}\n</current_plan>`;
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
