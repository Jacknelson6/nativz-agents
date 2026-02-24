import type { z } from "zod";

// Dynamic import to avoid issues if stagehand isn't installed
let StagehandClass: any = null;

async function getStagehand() {
  if (!StagehandClass) {
    const mod = await import("@browserbasehq/stagehand");
    StagehandClass = mod.Stagehand;
  }
  return StagehandClass;
}

export class StagehandManager {
  private static instance: StagehandManager;
  private stagehand: any = null;

  static getInstance(): StagehandManager {
    if (!StagehandManager.instance) {
      StagehandManager.instance = new StagehandManager();
    }
    return StagehandManager.instance;
  }

  async init(apiKey?: string): Promise<void> {
    if (this.stagehand) return;
    const Stagehand = await getStagehand();
    this.stagehand = new Stagehand({
      env: "LOCAL" as const,
      modelName: "claude-sonnet-4-20250514",
      modelClientOptions: {
        apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
      },
    });
    await this.stagehand.init();
  }

  private ensureInit(): void {
    if (!this.stagehand) {
      throw new Error("StagehandManager not initialized. Call init() first.");
    }
  }

  async act(instruction: string): Promise<any> {
    this.ensureInit();
    return this.stagehand.page.act(instruction);
  }

  async extract(instruction: string, schema?: z.ZodType): Promise<any> {
    this.ensureInit();
    const opts: any = { instruction };
    if (schema) opts.schema = schema;
    return this.stagehand.page.extract(opts);
  }

  async observe(instruction: string): Promise<any> {
    this.ensureInit();
    return this.stagehand.page.observe(instruction);
  }

  async navigate(url: string): Promise<void> {
    this.ensureInit();
    await this.stagehand.page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  }

  async screenshot(): Promise<Buffer> {
    this.ensureInit();
    return this.stagehand.page.screenshot({ fullPage: false });
  }

  async close(): Promise<void> {
    if (this.stagehand) {
      await this.stagehand.close();
      this.stagehand = null;
    }
  }
}
