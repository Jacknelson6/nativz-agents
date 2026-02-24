/**
 * Safety guardrails engine.
 * Pre/post-execution validation with PII detection and content policy.
 */

export interface GuardrailsConfig {
  maxTokensPerTurn: number;
  allowedDomains: string[];
  allowedTools: string[];
  blockedPatterns: string[];
  piiDetection: boolean;
  contentPolicy: boolean;
}

export interface InputValidation {
  allowed: boolean;
  reason?: string;
}

export interface OutputValidation {
  allowed: boolean;
  filtered?: string;
  flags: string[];
}

export interface ViolationLog {
  timestamp: number;
  type: "input" | "output";
  agentId: string;
  reason: string;
  flags: string[];
}

const PII_PATTERNS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: "email", pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { name: "phone", pattern: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g },
  { name: "ssn", pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g },
  { name: "credit_card", pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },
];

const DEFAULT_CONFIG: GuardrailsConfig = {
  maxTokensPerTurn: 8192,
  allowedDomains: [],
  allowedTools: [],
  blockedPatterns: [],
  piiDetection: true,
  contentPolicy: true,
};

export class GuardrailsEngine {
  private config: GuardrailsConfig;
  private violations: ViolationLog[] = [];
  private agentId: string;

  constructor(agentId: string, config?: Partial<GuardrailsConfig>) {
    this.agentId = agentId;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Pre-execution input validation.
   */
  validateInput(message: string): InputValidation {
    // Check token budget (rough estimate: 4 chars per token)
    const estimatedTokens = Math.ceil(message.length / 4);
    if (estimatedTokens > this.config.maxTokensPerTurn) {
      this.logViolation("input", "token_budget_exceeded", ["token_budget"]);
      return {
        allowed: false,
        reason: `Message exceeds token budget: ~${estimatedTokens} tokens (max ${this.config.maxTokensPerTurn})`,
      };
    }

    // Check blocked patterns
    for (const pattern of this.config.blockedPatterns) {
      const regex = new RegExp(pattern, "i");
      if (regex.test(message)) {
        this.logViolation("input", `blocked_pattern: ${pattern}`, ["blocked_content"]);
        return {
          allowed: false,
          reason: `Message contains blocked content pattern`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Post-execution output validation.
   */
  validateOutput(response: string): OutputValidation {
    const flags: string[] = [];
    let filtered = response;

    // PII detection
    if (this.config.piiDetection) {
      for (const { name, pattern } of PII_PATTERNS) {
        const matches = response.match(pattern);
        if (matches && matches.length > 0) {
          flags.push(`pii_${name}`);
          // Redact PII in filtered output
          filtered = filtered.replace(pattern, `[REDACTED_${name.toUpperCase()}]`);
        }
      }
    }

    // Content policy checks
    if (this.config.contentPolicy) {
      for (const pattern of this.config.blockedPatterns) {
        const regex = new RegExp(pattern, "i");
        if (regex.test(response)) {
          flags.push("blocked_content");
        }
      }
    }

    if (flags.length > 0) {
      this.logViolation("output", `flags: ${flags.join(", ")}`, flags);
    }

    return {
      allowed: flags.length === 0,
      filtered: flags.length > 0 ? filtered : undefined,
      flags,
    };
  }

  /**
   * Check if a tool is allowed for this agent.
   */
  isToolAllowed(toolName: string): boolean {
    if (this.config.allowedTools.length === 0) return true;
    return this.config.allowedTools.includes(toolName);
  }

  /**
   * Check if a domain is allowed for this agent.
   */
  isDomainAllowed(domain: string): boolean {
    if (this.config.allowedDomains.length === 0) return true;
    return this.config.allowedDomains.some(
      (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
    );
  }

  /**
   * Get all logged violations.
   */
  getViolations(): readonly ViolationLog[] {
    return this.violations;
  }

  /**
   * Get violations for this session.
   */
  getViolationCount(): number {
    return this.violations.length;
  }

  /**
   * Clear violation log.
   */
  clearViolations(): void {
    this.violations = [];
  }

  private logViolation(type: "input" | "output", reason: string, flags: string[]): void {
    this.violations.push({
      timestamp: Date.now(),
      type,
      agentId: this.agentId,
      reason,
      flags,
    });
  }
}
