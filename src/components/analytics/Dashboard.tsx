import { useEffect, lazy, Suspense } from 'react';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { BarChart3, DollarSign, Zap, MessageSquare } from 'lucide-react';

const LazyCharts = lazy(() => import('./AnalyticsCharts'));

export default function Dashboard() {
  const { usageStats, costStats, loading, refreshStats } = useAnalyticsStore();

  useEffect(() => {
    refreshStats();
  }, []);

  if (loading && !usageStats) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
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

  // Convert grouped stats to records for breakdown cards
  const byAgentRecord: Record<string, number> = {};
  for (const entry of usageStats?.byAgent ?? []) {
    byAgentRecord[entry.group] = entry.totalTokens;
  }
  const byModelRecord: Record<string, number> = {};
  for (const entry of usageStats?.byModel ?? []) {
    byModelRecord[entry.group] = entry.totalTokens;
  }
  const totalTokens = usageStats?.monthly?.totalTokens ?? 0;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 size={20} className="text-primary" />
          Usage Analytics
        </h1>
        <button
          onClick={refreshStats}
          className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 border border-border rounded-lg hover:bg-muted/30 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Zap size={14} />}
          label="Monthly Tokens"
          value={formatNumber(totalTokens)}
        />
        <StatCard
          icon={<DollarSign size={14} />}
          label="Today's Cost"
          value={formatCurrency(costStats?.todayCost ?? 0)}
        />
        <StatCard
          icon={<DollarSign size={14} />}
          label="Monthly Cost"
          value={formatCurrency(costStats?.monthCost ?? 0)}
        />
        <StatCard
          icon={<MessageSquare size={14} />}
          label="Conversations"
          value={formatNumber(costStats?.totalConversations ?? 0)}
        />
      </div>

      {/* Charts */}
      <Suspense fallback={<div className="text-xs text-muted-foreground text-center py-8">Loading charts...</div>}>
        <LazyCharts
          byModel={usageStats?.byModel ?? []}
          byAgent={usageStats?.byAgent ?? []}
          dailyInput={usageStats?.daily?.inputTokens ?? 0}
          dailyOutput={usageStats?.daily?.outputTokens ?? 0}
          monthlyInput={usageStats?.monthly?.inputTokens ?? 0}
          monthlyOutput={usageStats?.monthly?.outputTokens ?? 0}
        />
      </Suspense>

      {/* Token Usage Summary */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-4">Token Usage</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Today</div>
            <div className="text-lg font-semibold">{formatNumber(usageStats?.daily?.totalTokens ?? 0)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              In: {formatNumber(usageStats?.daily?.inputTokens ?? 0)} · Out: {formatNumber(usageStats?.daily?.outputTokens ?? 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">This Month</div>
            <div className="text-lg font-semibold">{formatNumber(usageStats?.monthly?.totalTokens ?? 0)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              In: {formatNumber(usageStats?.monthly?.inputTokens ?? 0)} · Out: {formatNumber(usageStats?.monthly?.outputTokens ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BreakdownCard
          title="By Agent"
          data={byAgentRecord}
          total={totalTokens}
          formatter={formatNumber}
        />
        <BreakdownCard
          title="By Model"
          data={byModelRecord}
          total={totalTokens}
          formatter={formatNumber}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-semibold">{value}</p>
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
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-xs font-medium mb-3">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-[10px] text-muted-foreground">No data</p>
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 6).map(([key, val]) => {
            const pct = total > 0 ? (val / total) * 100 : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="truncate text-muted-foreground">{key}</span>
                  <span className="font-mono ml-2">{formatter(val)}</span>
                </div>
                <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
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
