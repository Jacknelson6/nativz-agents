import { useState, useMemo } from 'react';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import {
  Calculator, TrendingDown, Zap, DollarSign, ArrowRight,
  CheckCircle, AlertCircle, Lightbulb, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  quality: 'premium' | 'standard' | 'budget';
  bestFor: string[];
}

interface Recommendation {
  taskType: string;
  currentModel: string;
  suggestedModel: string;
  currentCostPerTask: number;
  suggestedCostPerTask: number;
  monthlySavings: number;
  qualityImpact: 'none' | 'minimal' | 'moderate';
  tasksPerMonth: number;
}

// ── Model Pricing Data ─────────────────────────────────────────────────────

const MODEL_OPTIONS: ModelOption[] = [
  { id: 'claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic', inputCostPerMillion: 15, outputCostPerMillion: 75, quality: 'premium', bestFor: ['strategy', 'complex-analysis', 'creative'] },
  { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', inputCostPerMillion: 3, outputCostPerMillion: 15, quality: 'standard', bestFor: ['general', 'coding', 'analysis'] },
  { id: 'claude-haiku-3.5', name: 'Claude 3.5 Haiku', provider: 'Anthropic', inputCostPerMillion: 0.8, outputCostPerMillion: 4, quality: 'budget', bestFor: ['classification', 'extraction', 'simple-tasks'] },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', inputCostPerMillion: 2.5, outputCostPerMillion: 10, quality: 'standard', bestFor: ['general', 'coding', 'analysis'] },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', inputCostPerMillion: 0.15, outputCostPerMillion: 0.6, quality: 'budget', bestFor: ['simple-tasks', 'classification'] },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', inputCostPerMillion: 0.1, outputCostPerMillion: 0.4, quality: 'budget', bestFor: ['simple-tasks', 'batch', 'classification'] },
  { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', provider: 'Google', inputCostPerMillion: 1.25, outputCostPerMillion: 5, quality: 'standard', bestFor: ['general', 'analysis'] },
];

// ── Recommendations Engine ─────────────────────────────────────────────────

function generateRecommendations(monthlySpend: number): Recommendation[] {
  const avgInputTokensPerTask = 1500;
  const avgOutputTokensPerTask = 800;

  return [
    {
      taskType: 'Simple Q&A / Classification',
      currentModel: 'Claude Sonnet 4',
      suggestedModel: 'Gemini 2.0 Flash',
      currentCostPerTask: (avgInputTokensPerTask * 3 + avgOutputTokensPerTask * 15) / 1_000_000,
      suggestedCostPerTask: (avgInputTokensPerTask * 0.1 + avgOutputTokensPerTask * 0.4) / 1_000_000,
      monthlySavings: 0,
      qualityImpact: 'minimal' as const,
      tasksPerMonth: Math.round(monthlySpend * 0.3 / ((avgInputTokensPerTask * 3 + avgOutputTokensPerTask * 15) / 1_000_000)),
    },
    {
      taskType: 'Content Drafts',
      currentModel: 'Claude Opus 4',
      suggestedModel: 'Claude Sonnet 4',
      currentCostPerTask: (avgInputTokensPerTask * 15 + avgOutputTokensPerTask * 75) / 1_000_000,
      suggestedCostPerTask: (avgInputTokensPerTask * 3 + avgOutputTokensPerTask * 15) / 1_000_000,
      monthlySavings: 0,
      qualityImpact: 'minimal' as const,
      tasksPerMonth: Math.round(monthlySpend * 0.4 / ((avgInputTokensPerTask * 15 + avgOutputTokensPerTask * 75) / 1_000_000)),
    },
    {
      taskType: 'Data Extraction / Parsing',
      currentModel: 'Claude Sonnet 4',
      suggestedModel: 'GPT-4o Mini',
      currentCostPerTask: (avgInputTokensPerTask * 3 + avgOutputTokensPerTask * 15) / 1_000_000,
      suggestedCostPerTask: (avgInputTokensPerTask * 0.15 + avgOutputTokensPerTask * 0.6) / 1_000_000,
      monthlySavings: 0,
      qualityImpact: 'none' as const,
      tasksPerMonth: Math.round(monthlySpend * 0.2 / ((avgInputTokensPerTask * 3 + avgOutputTokensPerTask * 15) / 1_000_000)),
    },
  ].map((rec) => ({
    ...rec,
    monthlySavings: (rec.currentCostPerTask - rec.suggestedCostPerTask) * rec.tasksPerMonth,
  }));
}

// ── Component ──────────────────────────────────────────────────────────────

export default function CostCalculator() {
  const { costStats } = useAnalyticsStore();
  const [showModels, setShowModels] = useState(false);
  const [expandedRec, setExpandedRec] = useState<number | null>(null);

  const monthlySpend = costStats?.monthCost ?? 25;

  const recommendations = useMemo(() => generateRecommendations(monthlySpend), [monthlySpend]);
  const totalPotentialSavings = recommendations.reduce((sum, r) => sum + r.monthlySavings, 0);
  const savingsPercent = monthlySpend > 0 ? Math.round((totalPotentialSavings / monthlySpend) * 100) : 0;

  const subscriptionBreakeven = useMemo(() => {
    const anthropicSub = 200;
    const openaiSub = 200;
    return {
      anthropic: { monthlyCost: anthropicSub, breakevenAt: anthropicSub, worthIt: monthlySpend > anthropicSub * 0.7 },
      openai: { monthlyCost: openaiSub, breakevenAt: openaiSub, worthIt: monthlySpend > openaiSub * 0.7 },
    };
  }, [monthlySpend]);

  const qualityColors: Record<string, string> = {
    none: 'text-green-400',
    minimal: 'text-yellow-400',
    moderate: 'text-orange-400',
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Calculator size={20} className="text-accent" />
          Cost Optimization Advisor
        </h1>
      </div>

      {/* Current Spend */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            <DollarSign size={12} />
            Monthly Spend
          </div>
          <div className="text-xl font-semibold">${monthlySpend.toFixed(2)}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            <TrendingDown size={12} />
            Potential Savings
          </div>
          <div className="text-xl font-semibold text-green-400">${totalPotentialSavings.toFixed(2)}</div>
          <div className="text-[10px] text-muted">{savingsPercent}% reduction</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            <Zap size={12} />
            Optimized Cost
          </div>
          <div className="text-xl font-semibold text-accent">${(monthlySpend - totalPotentialSavings).toFixed(2)}</div>
          <div className="text-[10px] text-muted">per month</div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Lightbulb size={14} className="text-yellow-400" />
          Recommendations
        </h2>
        <div className="space-y-2">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="bg-surface border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedRec(expandedRec === idx ? null : idx)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <TrendingDown size={14} className="text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{rec.taskType}</div>
                    <div className="text-xs text-muted flex items-center gap-1">
                      {rec.currentModel}
                      <ArrowRight size={10} />
                      <span className="text-accent">{rec.suggestedModel}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-green-400">
                    -${rec.monthlySavings.toFixed(2)}/mo
                  </span>
                  {expandedRec === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {expandedRec === idx && (
                <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-muted">Current cost/task</div>
                      <div>${rec.currentCostPerTask.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-muted">Optimized cost/task</div>
                      <div className="text-green-400">${rec.suggestedCostPerTask.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-muted">Est. tasks/month</div>
                      <div>{rec.tasksPerMonth.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted">Quality impact:</span>
                    <span className={qualityColors[rec.qualityImpact]}>
                      {rec.qualityImpact === 'none' ? '✓ No impact' : rec.qualityImpact === 'minimal' ? '~ Minimal' : '⚠ Moderate'}
                    </span>
                  </div>
                  <button className="mt-2 w-full py-2 bg-accent text-black rounded-lg text-xs font-medium hover:bg-accent/90 transition-colors">
                    Apply This Optimization
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Comparison */}
      <div>
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <DollarSign size={14} className="text-accent" />
          Subscription vs API
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(subscriptionBreakeven).map(([provider, info]) => (
            <div key={provider} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium capitalize">{provider} Pro</span>
                {info.worthIt ? (
                  <span className="text-[10px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle size={10} />
                    Worth It
                  </span>
                ) : (
                  <span className="text-[10px] text-muted bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <AlertCircle size={10} />
                    Not Yet
                  </span>
                )}
              </div>
              <div className="text-xs text-muted space-y-1">
                <div>Subscription: ${info.monthlyCost}/mo</div>
                <div>Your API spend: ${monthlySpend.toFixed(2)}/mo</div>
                <div className={info.worthIt ? 'text-green-400' : 'text-muted'}>
                  {info.worthIt
                    ? `You'd save ~$${(monthlySpend - info.monthlyCost).toFixed(2)}/mo`
                    : `Need ~$${(info.breakevenAt - monthlySpend).toFixed(2)} more spend to justify`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Pricing Reference */}
      <div>
        <button
          onClick={() => setShowModels(!showModels)}
          className="text-sm font-medium mb-3 flex items-center gap-2 hover:text-accent transition-colors"
        >
          Model Pricing Reference
          {showModels ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showModels && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="text-left p-3">Model</th>
                  <th className="text-left p-3">Provider</th>
                  <th className="text-right p-3">Input $/M</th>
                  <th className="text-right p-3">Output $/M</th>
                  <th className="text-left p-3">Tier</th>
                </tr>
              </thead>
              <tbody>
                {MODEL_OPTIONS.map((m) => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="p-3 font-medium">{m.name}</td>
                    <td className="p-3 text-muted">{m.provider}</td>
                    <td className="p-3 text-right">${m.inputCostPerMillion}</td>
                    <td className="p-3 text-right">${m.outputCostPerMillion}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        m.quality === 'premium' ? 'bg-purple-500/10 text-purple-400' :
                        m.quality === 'standard' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {m.quality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
