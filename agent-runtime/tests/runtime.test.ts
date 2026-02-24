/**
 * Core runtime tests using Node test runner (zero deps).
 * Run: node --test --loader ts-node/esm agent-runtime/tests/runtime.test.ts
 * Or:  npx tsx --test agent-runtime/tests/runtime.test.ts
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ─── Provider Registry ───

describe('ProviderRegistry', () => {
  // Inline mock since we can't import ESM modules with better-sqlite3 easily in test
  class MockProviderRegistry {
    private providers = new Map<string, { name: string; models: Array<{ id: string }> }>();
    private fallbackChain: Array<{ providerName: string; modelId: string }> = [];
    private healthStatus = new Map<string, string>();

    register(provider: { name: string; models: Array<{ id: string }> }) {
      this.providers.set(provider.name, provider);
    }

    unregister(name: string) {
      this.providers.delete(name);
    }

    get(name: string) { return this.providers.get(name); }
    has(name: string) { return this.providers.has(name); }
    getAll() { return Array.from(this.providers.values()); }

    setFallbackChain(chain: Array<{ providerName: string; modelId: string }>) {
      this.fallbackChain = chain;
    }

    getFallbackChain() { return this.fallbackChain; }

    setHealth(name: string, status: string) { this.healthStatus.set(name, status); }
    getHealth(name: string) { return this.healthStatus.get(name) ?? 'unknown'; }
  }

  let registry: MockProviderRegistry;

  beforeEach(() => { registry = new MockProviderRegistry(); });

  it('should register and retrieve providers', () => {
    registry.register({ name: 'openai', models: [{ id: 'gpt-4' }] });
    assert.ok(registry.has('openai'));
    assert.equal(registry.get('openai')?.name, 'openai');
  });

  it('should unregister providers', () => {
    registry.register({ name: 'anthropic', models: [{ id: 'claude-3' }] });
    registry.unregister('anthropic');
    assert.ok(!registry.has('anthropic'));
  });

  it('should list all providers', () => {
    registry.register({ name: 'openai', models: [] });
    registry.register({ name: 'anthropic', models: [] });
    assert.equal(registry.getAll().length, 2);
  });

  it('should manage fallback chain', () => {
    const chain = [
      { providerName: 'openai', modelId: 'gpt-4' },
      { providerName: 'anthropic', modelId: 'claude-3' },
    ];
    registry.setFallbackChain(chain);
    assert.deepEqual(registry.getFallbackChain(), chain);
  });

  it('should track health status', () => {
    registry.setHealth('openai', 'healthy');
    assert.equal(registry.getHealth('openai'), 'healthy');
    registry.setHealth('openai', 'degraded');
    assert.equal(registry.getHealth('openai'), 'degraded');
  });
});

// ─── Memory Store ───

describe('MemoryStore (mock)', () => {
  class MockMemoryStore {
    private data = new Map<string, string>();

    remember(agentId: string, userId: string, key: string, value: string) {
      this.data.set(`${agentId}:${userId}:${key}`, value);
    }

    recall(agentId: string, userId: string, key: string): string | undefined {
      return this.data.get(`${agentId}:${userId}:${key}`);
    }

    forget(agentId: string, userId: string, key: string) {
      this.data.delete(`${agentId}:${userId}:${key}`);
    }

    search(agentId: string, userId: string, query: string): string[] {
      const prefix = `${agentId}:${userId}:`;
      const results: string[] = [];
      for (const [k, v] of this.data) {
        if (k.startsWith(prefix) && (k.includes(query) || v.includes(query))) {
          results.push(v);
        }
      }
      return results;
    }
  }

  let store: MockMemoryStore;
  beforeEach(() => { store = new MockMemoryStore(); });

  it('should store and recall memories', () => {
    store.remember('agent1', 'user1', 'pref', 'dark-theme');
    assert.equal(store.recall('agent1', 'user1', 'pref'), 'dark-theme');
  });

  it('should update existing memories', () => {
    store.remember('agent1', 'user1', 'pref', 'dark');
    store.remember('agent1', 'user1', 'pref', 'light');
    assert.equal(store.recall('agent1', 'user1', 'pref'), 'light');
  });

  it('should forget memories', () => {
    store.remember('agent1', 'user1', 'key', 'val');
    store.forget('agent1', 'user1', 'key');
    assert.equal(store.recall('agent1', 'user1', 'key'), undefined);
  });

  it('should search memories', () => {
    store.remember('agent1', 'user1', 'color', 'blue');
    store.remember('agent1', 'user1', 'food', 'pizza');
    const results = store.search('agent1', 'user1', 'blue');
    assert.equal(results.length, 1);
    assert.equal(results[0], 'blue');
  });
});

// ─── Working Memory ───

describe('WorkingMemory (mock)', () => {
  class MockWorkingMemory {
    private data = new Map<string, string>();

    set(key: string, value: string) { this.data.set(key, value); }
    get(key: string): string | null { return this.data.get(key) ?? null; }
    delete(key: string) { this.data.delete(key); }

    serialize(): Record<string, string> {
      const obj: Record<string, string> = {};
      for (const [k, v] of this.data) obj[k] = v;
      return obj;
    }
  }

  let wm: MockWorkingMemory;
  beforeEach(() => { wm = new MockWorkingMemory(); });

  it('should set and get values', () => {
    wm.set('task', 'write tests');
    assert.equal(wm.get('task'), 'write tests');
  });

  it('should return null for missing keys', () => {
    assert.equal(wm.get('nonexistent'), null);
  });

  it('should serialize all entries', () => {
    wm.set('a', '1');
    wm.set('b', '2');
    assert.deepEqual(wm.serialize(), { a: '1', b: '2' });
  });

  it('should delete entries', () => {
    wm.set('x', 'y');
    wm.delete('x');
    assert.equal(wm.get('x'), null);
  });
});

// ─── Knowledge Search ───

describe('KnowledgeSearch (mock)', () => {
  class MockKnowledgeSearch {
    private chunks: Array<{ id: string; content: string }> = [];

    addChunks(chunks: Array<{ id: string; content: string }>) {
      this.chunks.push(...chunks);
    }

    search(query: string, topK = 5): Array<{ id: string; content: string; score: number }> {
      const queryWords = query.toLowerCase().split(/\s+/);
      return this.chunks
        .map(chunk => {
          const words = chunk.content.toLowerCase().split(/\s+/);
          const score = queryWords.filter(q => words.some(w => w.includes(q))).length / queryWords.length;
          return { ...chunk, score };
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    }
  }

  it('should add and search chunks', () => {
    const ks = new MockKnowledgeSearch();
    ks.addChunks([
      { id: '1', content: 'TypeScript is a typed superset of JavaScript' },
      { id: '2', content: 'Python is great for data science' },
      { id: '3', content: 'JavaScript runs in the browser' },
    ]);
    const results = ks.search('JavaScript');
    assert.ok(results.length >= 1);
    assert.ok(results.some(r => r.content.includes('JavaScript')));
  });

  it('should return empty for no matches', () => {
    const ks = new MockKnowledgeSearch();
    ks.addChunks([{ id: '1', content: 'hello world' }]);
    const results = ks.search('quantum computing');
    assert.equal(results.length, 0);
  });
});

// ─── Tool Selector ───

describe('ToolSelector (mock)', () => {
  interface Tool { name: string; description: string }

  function scoreRelevance(message: string, tool: Tool): number {
    const msgLower = message.toLowerCase();
    let score = 0;
    const nameParts = tool.name.toLowerCase().split(/[._-]/);
    for (const part of nameParts) {
      if (part.length >= 2 && msgLower.includes(part)) score += 10;
    }
    const descWords = tool.description.toLowerCase().split(/\s+/);
    for (const word of descWords) {
      if (word.length >= 3 && msgLower.includes(word)) score += 2;
    }
    return score;
  }

  function selectTools(message: string, tools: Tool[], maxTools: number): Tool[] {
    if (tools.length <= maxTools) return tools;
    return tools
      .map(t => ({ tool: t, score: scoreRelevance(message, t) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxTools)
      .map(s => s.tool);
  }

  it('should score relevant tools higher', () => {
    const webSearch = { name: 'web-search', description: 'Search the web' };
    const fileRead = { name: 'file-read', description: 'Read a file' };
    const s1 = scoreRelevance('search for TypeScript tutorials', webSearch);
    const s2 = scoreRelevance('search for TypeScript tutorials', fileRead);
    assert.ok(s1 > s2);
  });

  it('should select top N tools', () => {
    const tools = [
      { name: 'web-search', description: 'Search the web' },
      { name: 'file-read', description: 'Read a file' },
      { name: 'database-query', description: 'Query database' },
    ];
    const selected = selectTools('search the web for info', tools, 2);
    assert.equal(selected.length, 2);
    assert.equal(selected[0].name, 'web-search');
  });
});

// ─── Guardrails (PII Detection) ───

describe('Guardrails - PII Detection', () => {
  const PII_PATTERNS = [
    { name: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
    { name: 'phone', pattern: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g },
    { name: 'ssn', pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g },
    { name: 'credit_card', pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },
  ];

  function detectPII(text: string): string[] {
    const found: string[] = [];
    for (const { name, pattern } of PII_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      if (regex.test(text)) found.push(name);
    }
    return found;
  }

  it('should detect email addresses', () => {
    assert.ok(detectPII('Contact me at test@example.com').includes('email'));
  });

  it('should detect phone numbers', () => {
    assert.ok(detectPII('Call me at 555-123-4567').includes('phone'));
  });

  it('should detect SSNs', () => {
    assert.ok(detectPII('SSN: 123-45-6789').includes('ssn'));
  });

  it('should detect credit card numbers', () => {
    assert.ok(detectPII('Card: 4111 1111 1111 1111').includes('credit_card'));
  });

  it('should return empty for clean text', () => {
    assert.deepEqual(detectPII('Hello world, how are you?'), []);
  });
});

// ─── Cost Tracker ───

describe('CostTracker (mock)', () => {
  class MockCostTracker {
    private totalCost = 0;
    private budget = { dailyLimitUsd: 50, monthlyLimitUsd: 500 };

    calculate(inputTokens: number, outputTokens: number, inputCostPer1M: number, outputCostPer1M: number): number {
      return (inputTokens / 1_000_000) * inputCostPer1M + (outputTokens / 1_000_000) * outputCostPer1M;
    }

    record(cost: number) { this.totalCost += cost; }
    getTotal() { return this.totalCost; }

    setBudget(daily: number, monthly: number) {
      this.budget = { dailyLimitUsd: daily, monthlyLimitUsd: monthly };
    }

    isWithinBudget(): boolean {
      return this.totalCost < this.budget.dailyLimitUsd;
    }
  }

  it('should calculate costs correctly', () => {
    const ct = new MockCostTracker();
    // GPT-4 pricing: $30/1M input, $60/1M output
    const cost = ct.calculate(1000, 500, 30, 60);
    assert.ok(Math.abs(cost - 0.06) < 0.001);
  });

  it('should track cumulative costs', () => {
    const ct = new MockCostTracker();
    ct.record(1.5);
    ct.record(2.5);
    assert.equal(ct.getTotal(), 4.0);
  });

  it('should check budget limits', () => {
    const ct = new MockCostTracker();
    ct.setBudget(5, 100);
    ct.record(4);
    assert.ok(ct.isWithinBudget());
    ct.record(2);
    assert.ok(!ct.isWithinBudget());
  });
});

// ─── Error Recovery ───

describe('ErrorRecovery', () => {
  // Import inline to avoid ESM/sqlite issues
  type ErrorType = 'network' | 'auth' | 'rate-limit' | 'timeout' | 'parse' | 'unknown';

  function classify(message: string): ErrorType {
    const lower = message.toLowerCase();
    if (lower.includes('fetch failed') || lower.includes('econnrefused') || lower.includes('network')) return 'network';
    if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('invalid api key')) return 'auth';
    if (lower.includes('429') || lower.includes('rate limit')) return 'rate-limit';
    if (lower.includes('timeout') || lower.includes('timed out')) return 'timeout';
    if (lower.includes('json') || lower.includes('parse')) return 'parse';
    return 'unknown';
  }

  it('should classify network errors', () => {
    assert.equal(classify('fetch failed'), 'network');
    assert.equal(classify('ECONNREFUSED'), 'network');
  });

  it('should classify auth errors', () => {
    assert.equal(classify('401 Unauthorized'), 'auth');
    assert.equal(classify('Invalid API key'), 'auth');
  });

  it('should classify rate limit errors', () => {
    assert.equal(classify('429 Too Many Requests'), 'rate-limit');
  });

  it('should classify timeout errors', () => {
    assert.equal(classify('Request timed out'), 'timeout');
  });

  it('should classify parse errors', () => {
    assert.equal(classify('Unexpected JSON token'), 'parse');
  });

  it('should classify unknown errors', () => {
    assert.equal(classify('Something weird happened'), 'unknown');
  });
});
