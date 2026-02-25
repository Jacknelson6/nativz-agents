import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

interface ChartsProps {
  byModel: Array<{ group: string; inputTokens: number; outputTokens: number; totalTokens: number }>;
  byAgent: Array<{ group: string; inputTokens: number; outputTokens: number; totalTokens: number }>;
  dailyInput: number;
  dailyOutput: number;
  monthlyInput: number;
  monthlyOutput: number;
}

const formatTokenLabel = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomBarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-2 text-xs shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatTokenLabel(entry.value)}
        </p>
      ))}
    </div>
  );
}

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}

function CustomPieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg p-2 text-xs shadow-lg">
      <p className="font-medium">{entry.name}</p>
      <p className="text-muted-foreground">{formatTokenLabel(entry.value)} tokens</p>
    </div>
  );
}

export default function AnalyticsCharts({
  byModel,
  dailyInput,
  dailyOutput,
  monthlyInput,
  monthlyOutput,
}: ChartsProps) {
  const barData = [
    { period: 'Today', Input: dailyInput, Output: dailyOutput },
    { period: 'This Month', Input: monthlyInput, Output: monthlyOutput },
  ];

  const pieData = byModel
    .filter((m) => m.totalTokens > 0)
    .map((m) => ({ name: m.group, value: m.totalTokens }));

  const hasBarData = dailyInput > 0 || dailyOutput > 0 || monthlyInput > 0 || monthlyOutput > 0;
  const hasPieData = pieData.length > 0;

  if (!hasBarData && !hasPieData) {
    return (
      <div className="text-xs text-muted-foreground text-center py-8">
        No chart data available yet. Start using the agent to see analytics.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Bar Chart: Input vs Output Tokens */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-4">Input vs Output Tokens</h3>
        {hasBarData ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barCategoryGap="30%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="period"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatTokenLabel}
                width={50}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: 'var(--muted-foreground)' }}
              />
              <Bar dataKey="Input" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Output" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">
            No token data yet
          </div>
        )}
      </div>

      {/* Pie Chart: Token Usage by Model */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-4">Usage by Model</h3>
        {hasPieData ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend
                formatter={(value: string) => (
                  <span style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>{value}</span>
                )}
                wrapperStyle={{ fontSize: 10 }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">
            No model data yet
          </div>
        )}
      </div>
    </div>
  );
}
