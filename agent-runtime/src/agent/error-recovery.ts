/**
 * Robust error recovery with classification, retry strategies, circuit breaker, and telemetry.
 */

export type ErrorType = 'network' | 'auth' | 'rate-limit' | 'timeout' | 'parse' | 'unknown';

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  provider?: string;
  model?: string;
  retryAfterMs?: number;
  originalError: unknown;
}

export interface RecoveryResult {
  recovered: boolean;
  action: string;
  retryAfterMs?: number;
  userMessage?: string;
  fallbackProvider?: string;
}

interface ErrorTelemetryEntry {
  timestamp: number;
  type: ErrorType;
  provider: string;
  model: string;
}

interface CircuitState {
  failures: number[];
  status: 'closed' | 'open' | 'half-open';
  openedAt?: number;
}

const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const CIRCUIT_COOLDOWN_MS = 60 * 1000; // 1 minute before half-open

export class ErrorRecovery {
  private telemetry: ErrorTelemetryEntry[] = [];
  private circuits: Map<string, CircuitState> = new Map();

  /**
   * Classify an error into a known type with recovery metadata.
   */
  classify(error: unknown, provider?: string, model?: string): ClassifiedError {
    const msg = error instanceof Error ? error.message : String(error);
    const lowerMsg = msg.toLowerCase();

    let type: ErrorType = 'unknown';
    let retryAfterMs: number | undefined;

    if (lowerMsg.includes('fetch failed') || lowerMsg.includes('econnrefused') ||
        lowerMsg.includes('enotfound') || lowerMsg.includes('network') ||
        lowerMsg.includes('socket hang up') || lowerMsg.includes('econnreset')) {
      type = 'network';
    } else if (lowerMsg.includes('401') || lowerMsg.includes('403') ||
               lowerMsg.includes('unauthorized') || lowerMsg.includes('invalid api key') ||
               lowerMsg.includes('authentication') || lowerMsg.includes('forbidden')) {
      type = 'auth';
    } else if (lowerMsg.includes('429') || lowerMsg.includes('rate limit') ||
               lowerMsg.includes('too many requests') || lowerMsg.includes('quota')) {
      type = 'rate-limit';
      retryAfterMs = this.parseRetryAfter(error) ?? 30_000;
    } else if (lowerMsg.includes('timeout') || lowerMsg.includes('timed out') ||
               lowerMsg.includes('deadline exceeded') || lowerMsg.includes('aborted')) {
      type = 'timeout';
    } else if (lowerMsg.includes('json') || lowerMsg.includes('parse') ||
               lowerMsg.includes('unexpected token') || lowerMsg.includes('invalid response')) {
      type = 'parse';
    }

    return { type, message: msg, provider, model, retryAfterMs, originalError: error };
  }

  /**
   * Get recovery strategy for a classified error.
   */
  getRecoveryStrategy(error: ClassifiedError, attempt: number = 0): RecoveryResult {
    switch (error.type) {
      case 'network':
        if (attempt >= 3) {
          return { recovered: false, action: 'max_retries_exceeded', userMessage: 'Network error persists. Check your connection.' };
        }
        return {
          recovered: true,
          action: 'retry_with_backoff',
          retryAfterMs: Math.min(1000 * Math.pow(2, attempt), 30_000),
        };

      case 'auth':
        return {
          recovered: false,
          action: 'surface_to_user',
          userMessage: `Authentication failed for ${error.provider ?? 'provider'}. Please check your API key in Settings → Providers.`,
        };

      case 'rate-limit':
        return {
          recovered: true,
          action: 'queue_and_retry',
          retryAfterMs: error.retryAfterMs ?? 30_000,
        };

      case 'timeout':
        if (attempt >= 2) {
          return { recovered: false, action: 'max_retries_exceeded', userMessage: 'Request keeps timing out. Try a smaller prompt or different model.' };
        }
        return {
          recovered: true,
          action: 'retry_with_increased_timeout',
          retryAfterMs: 1000,
        };

      case 'parse':
        if (attempt >= 2) {
          return { recovered: false, action: 'parse_failure', userMessage: 'Failed to parse response. Try rephrasing your message.' };
        }
        return {
          recovered: true,
          action: 'retry_with_simpler_prompt',
          retryAfterMs: 500,
        };

      default:
        return {
          recovered: false,
          action: 'unknown_error',
          userMessage: `Unexpected error: ${error.message}`,
        };
    }
  }

  /**
   * Record an error for telemetry and circuit breaker tracking.
   */
  recordError(error: ClassifiedError): void {
    const now = Date.now();
    this.telemetry.push({
      timestamp: now,
      type: error.type,
      provider: error.provider ?? 'unknown',
      model: error.model ?? 'unknown',
    });

    // Trim old telemetry (keep last hour)
    const oneHourAgo = now - 3600_000;
    this.telemetry = this.telemetry.filter(e => e.timestamp > oneHourAgo);

    // Update circuit breaker
    if (error.provider) {
      this.recordCircuitFailure(error.provider);
    }
  }

  /**
   * Check if a provider is healthy (circuit breaker).
   */
  isProviderHealthy(provider: string): boolean {
    const circuit = this.circuits.get(provider);
    if (!circuit) return true;

    const now = Date.now();

    if (circuit.status === 'open') {
      if (circuit.openedAt && now - circuit.openedAt > CIRCUIT_COOLDOWN_MS) {
        circuit.status = 'half-open';
        return true; // Allow one probe request
      }
      return false;
    }

    return true;
  }

  /**
   * Record a successful call (resets circuit breaker).
   */
  recordSuccess(provider: string): void {
    const circuit = this.circuits.get(provider);
    if (circuit) {
      circuit.failures = [];
      circuit.status = 'closed';
      circuit.openedAt = undefined;
    }
  }

  /**
   * Get error rates by provider/model for telemetry.
   */
  getErrorRates(): Record<string, { total: number; byType: Partial<Record<ErrorType, number>> }> {
    const rates: Record<string, { total: number; byType: Partial<Record<ErrorType, number>> }> = {};
    for (const entry of this.telemetry) {
      const key = `${entry.provider}/${entry.model}`;
      if (!rates[key]) rates[key] = { total: 0, byType: {} };
      rates[key].total++;
      rates[key].byType[entry.type] = (rates[key].byType[entry.type] ?? 0) + 1;
    }
    return rates;
  }

  /**
   * Get all unhealthy providers (open circuits).
   */
  getUnhealthyProviders(): string[] {
    const unhealthy: string[] = [];
    for (const [provider, circuit] of this.circuits) {
      if (circuit.status === 'open') unhealthy.push(provider);
    }
    return unhealthy;
  }

  /**
   * Execute a function with automatic error recovery.
   */
  async withRecovery<T>(
    fn: () => Promise<T>,
    options: { provider?: string; model?: string; maxAttempts?: number; onRetry?: (attempt: number, strategy: RecoveryResult) => void } = {}
  ): Promise<T> {
    const maxAttempts = options.maxAttempts ?? 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await fn();
        if (options.provider) this.recordSuccess(options.provider);
        return result;
      } catch (err) {
        const classified = this.classify(err, options.provider, options.model);
        this.recordError(classified);
        const strategy = this.getRecoveryStrategy(classified, attempt);

        if (!strategy.recovered || attempt === maxAttempts - 1) {
          throw Object.assign(new Error(strategy.userMessage ?? classified.message), {
            classified,
            strategy,
          });
        }

        options.onRetry?.(attempt, strategy);

        if (strategy.retryAfterMs) {
          await new Promise(resolve => setTimeout(resolve, strategy.retryAfterMs));
        }
      }
    }

    throw new Error('Max recovery attempts exceeded');
  }

  private recordCircuitFailure(provider: string): void {
    const now = Date.now();
    let circuit = this.circuits.get(provider);
    if (!circuit) {
      circuit = { failures: [], status: 'closed' };
      this.circuits.set(provider, circuit);
    }

    // Only count failures within the window
    circuit.failures = circuit.failures.filter(t => now - t < CIRCUIT_WINDOW_MS);
    circuit.failures.push(now);

    if (circuit.failures.length >= CIRCUIT_FAILURE_THRESHOLD && circuit.status !== 'open') {
      circuit.status = 'open';
      circuit.openedAt = now;
    }
  }

  private parseRetryAfter(error: unknown): number | undefined {
    if (error && typeof error === 'object') {
      const headers = (error as Record<string, unknown>)['headers'];
      if (headers && typeof headers === 'object') {
        const retryAfter = (headers as Record<string, string>)['retry-after'];
        if (retryAfter) {
          const seconds = Number(retryAfter);
          if (!isNaN(seconds)) return seconds * 1000;
          const date = Date.parse(retryAfter);
          if (!isNaN(date)) return Math.max(0, date - Date.now());
        }
      }
    }
    return undefined;
  }
}
