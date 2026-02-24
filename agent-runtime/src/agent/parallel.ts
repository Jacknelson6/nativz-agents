/**
 * Parallel tool execution engine.
 * Detects independent tool calls and runs them concurrently.
 */

export interface ToolCallRequest {
  id: string;
  name: string;
  input: Record<string, unknown>;
  dependsOn?: string[];
}

export interface ToolCallResult {
  id: string;
  name: string;
  result: string;
  durationMs: number;
  error?: string;
}

export interface ParallelExecutorConfig {
  maxParallelism: number;
  timeoutMs: number;
}

type ToolExecuteFn = (name: string, input: Record<string, unknown>) => Promise<string>;

const DEFAULT_CONFIG: ParallelExecutorConfig = {
  maxParallelism: 3,
  timeoutMs: 30_000,
};

export class ParallelExecutor {
  private config: ParallelExecutorConfig;

  constructor(config?: Partial<ParallelExecutorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute tool calls, running independent ones in parallel.
   * Tools with dependencies run after their prerequisites complete.
   */
  async execute(
    calls: ToolCallRequest[],
    executeFn: ToolExecuteFn
  ): Promise<ToolCallResult[]> {
    if (calls.length === 0) return [];

    // Build dependency graph
    const { layers } = this.buildExecutionLayers(calls);
    const results: ToolCallResult[] = [];

    // Execute layer by layer (each layer runs in parallel)
    for (const layer of layers) {
      const layerResults = await this.executeLayer(layer, executeFn);
      results.push(...layerResults);
    }

    return results;
  }

  /**
   * Detect dependencies between tool calls.
   * A call depends on another if its input references the other's output ID.
   */
  detectDependencies(calls: ToolCallRequest[]): ToolCallRequest[] {
    const callIds = new Set(calls.map((c) => c.id));

    return calls.map((call) => {
      const deps: string[] = [];
      const inputStr = JSON.stringify(call.input);

      for (const otherId of callIds) {
        if (otherId !== call.id && inputStr.includes(otherId)) {
          deps.push(otherId);
        }
      }

      // Also respect explicit dependsOn
      if (call.dependsOn) {
        for (const dep of call.dependsOn) {
          if (!deps.includes(dep)) deps.push(dep);
        }
      }

      return { ...call, dependsOn: deps.length > 0 ? deps : undefined };
    });
  }

  /**
   * Build execution layers from dependency graph.
   * Each layer contains calls that can run in parallel.
   */
  private buildExecutionLayers(
    calls: ToolCallRequest[]
  ): { layers: ToolCallRequest[][] } {
    const enriched = this.detectDependencies(calls);
    const completed = new Set<string>();
    const remaining = new Map(enriched.map((c) => [c.id, c]));
    const layers: ToolCallRequest[][] = [];

    while (remaining.size > 0) {
      const layer: ToolCallRequest[] = [];

      for (const [id, call] of remaining) {
        const depsResolved =
          !call.dependsOn || call.dependsOn.every((d) => completed.has(d));
        if (depsResolved) {
          layer.push(call);
        }
      }

      if (layer.length === 0) {
        // Circular dependency — force remaining into one layer
        layer.push(...remaining.values());
        remaining.clear();
      } else {
        for (const call of layer) {
          remaining.delete(call.id);
          completed.add(call.id);
        }
      }

      layers.push(layer);
    }

    return { layers };
  }

  /**
   * Execute a single layer with bounded parallelism.
   */
  private async executeLayer(
    layer: ToolCallRequest[],
    executeFn: ToolExecuteFn
  ): Promise<ToolCallResult[]> {
    const results: ToolCallResult[] = [];

    // Process in batches of maxParallelism
    for (let i = 0; i < layer.length; i += this.config.maxParallelism) {
      const batch = layer.slice(i, i + this.config.maxParallelism);
      const batchResults = await Promise.all(
        batch.map((call) => this.executeWithTimeout(call, executeFn))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Execute a single tool call with timeout.
   */
  private async executeWithTimeout(
    call: ToolCallRequest,
    executeFn: ToolExecuteFn
  ): Promise<ToolCallResult> {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        executeFn(call.name, call.input),
        this.timeout(this.config.timeoutMs),
      ]);

      return {
        id: call.id,
        name: call.name,
        result,
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        id: call.id,
        name: call.name,
        result: JSON.stringify({ error: message }),
        durationMs: Date.now() - startTime,
        error: message,
      };
    }
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Tool call timed out after ${ms}ms`)), ms);
    });
  }
}
