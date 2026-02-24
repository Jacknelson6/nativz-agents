import { useEffect } from 'react';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { BarChart3, DollarSign, Zap, TrendingDown } from 'lucide-react';

export default function Dashboard() {
  const { usageStats, costStats, loading, refreshStats } = useAnalyticsStore();

  useEffect(() => {
    refreshStats();
  }, []);

  if (loading && !usageStats) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        Loading analytics...
      </div>
    );
  }

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  const formatCurrency = (n: number) => {
    if (n < 0.01) return '$0.00';
    return `$${n.toFixed(2)}`;
  };

  // Token usage bar chart
  const dailyData = usageStats?.daily ?? [];
  const maxTokens = Math.max(...dailyData.map((d) => d.totalTokens), 1);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 size={20} className="text-accent" />
          Usage Analytics
        </h1>
        <button
          onClick={refreshStats}
          className="text-xs text-muted hover:text-white px-3 py-1.5 border border-border rounded-lg hover:bg-white/5 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          icon={<Zap size={14} />}
          label="Total Tokens"
          value={formatNumber(usageStats?.totalTokens ?? 0)}
        />
        <StatCard
          icon={<DollarSign size={14} />}
          label="Monthly Cost"
          value={formatCurrency(costStats?.monthlyCost ?? 0)}
        />
        <StatCard
          icon={<DollarSign size={14} />}
          label="Total Cost"
          value={formatCurrency(costStats?.totalCost ?? 0)}
        />
        <StatCard
          icon={<TrendingDown size={14} />}
          label="Subscription Savings"
          value={formatCurrency(costStats?.subscriptionSavings ?? 0)}
          accent
        />
      </div>

      {/* Token Usage Chart */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-4">Daily Token Usage</h3>
        {dailyData.length === 0 ? (
          <p className="text-xs text-muted text-center py-8">No usage data yet</p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {dailyData.slice(-30).map((day) => {
              const heightPct = (day.totalTokens / maxTokens) * 100;
              const inputPct = (day.inputTokens / (day.totalTokens || 1)) * 100;
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  <div
                    className="w-full rounded-t relative overflow-hidden cursor-pointer"
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                  >
                    <div
                      className="absolute bottom-0 w-full bg-accent/60"
                      style={{ height: `${inputPct}%` }}
                    />
                    <div
                      className="absolute top-0 w-full bg-accent"
                      style={{ height: `${100 - inputPct}%` }}
                    />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black border border-border rounded-lg px-2 py-1 text-[10px] whitespace-nowrap z-10">
                    <p className="font-medium">{day.date}</p>
                    <p className="text-muted">In: {formatNumber(day.inputTokens)}</p>
                    <p className="text-muted">Out: {formatNumber(day.outputTokens)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-4 mt-3 text-[10px] text-muted">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-accent rounded-sm" /> Output
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-accent/60 rounded-sm" /> Input
          </div>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-3 gap-3">
        <BreakdownCard
          title="By Agent"
          data={usageStats?.byAgent ?? {}}
          total={usageStats?.totalTokens ?? 0}
          formatter={formatNumber}
        />
        <BreakdownCard
          title="By Model"
          data={usageStats?.byModel ?? {}}
          total={usageStats?.totalTokens ?? 0}
          formatter={formatNumber}
        />
        <BreakdownCard
          title="Cost by Provider"
          data={costStats?.byProvider ?? {}}
          total={costStats?.totalCost ?? 0}
          formatter={formatCurrency}
        />
      </div>

      {/* Daily Cost */}
      {costStats && Object.keys(costStats.dailyCost).length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium mb-3">Daily Costs</h3>
          <div className="space-y-1.5">
            {Object.entries(costStats.dailyCost)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 14)
              .map(([date, cost]) => {
                const maxDailyCost = Math.max(
                  ...Object.values(costStats.dailyCost),
                  0.01
                );
                const widthPct = (cost / maxDailyCost) * 100;
                return (
                  <div key={date} className="flex items-center gap-3 text-xs">
                    <span className="text-muted w-20 shrink-0">{date}</span>
                    <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                      <div
                        className="h-full bg-accent/40 rounded"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-mono text-muted">
                      {formatCurrency(cost)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-muted mb-2">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xl font-semibold ${accent ? 'text-success' : ''}`}>{value}</p>
    </div>
  );
}

function BreakdownCard({
  title,
  data,
  total,
  formatter,
}: {
  title: string;
  data: Record<string, number>;
  total: number;
  formatter: (n: number) => string;
}) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h3 className="text-xs font-medium mb-3">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-[10px] text-muted">No data</p>
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 6).map(([key, val]) => {
            const pct = total > 0 ? (val / total) * 100 : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="truncate text-muted">{key}</span>
                  <span className="font-mono ml-2">{formatter(val)}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
