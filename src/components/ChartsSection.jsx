import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { STAGES } from './stages';

const STAGE_COLORS = {
  wishlist: '#64748b',
  applied: '#3b82f6',
  interviewing: '#f59e0b',
  offer: '#10b981',
  closed: '#f43f5e',
};

function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function formatWeekLabel(weekStart) {
  return weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ChartsSection({ applications }) {
  const currentWeekStart = getWeekStart(new Date());
  const weeklyData = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const count = applications.filter((a) => {
      const d = new Date(a.date_applied || a.created_date);
      return d >= weekStart && d < weekEnd;
    }).length;
    weeklyData.push({ label: formatWeekLabel(weekStart), count });
  }

  const activeApps = applications.filter((a) => !a.archived);
  const statusData = STAGES.map((s) => ({
    name: s.label,
    value: activeApps.filter((a) => a.status === s.key).length,
    color: STAGE_COLORS[s.key],
  })).filter((s) => s.value > 0);

  const total = activeApps.length;

  const tooltipStyle = {
    background: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: 12,
    color: 'hsl(var(--popover-foreground))',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-6 pb-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-1">Applications per Week</h3>
        <p className="text-xs text-muted-foreground mb-3">Last 8 weeks of activity</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: 'hsl(var(--accent))' }}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-1">Status Breakdown</h3>
        <p className="text-xs text-muted-foreground mb-3">{total} active {total === 1 ? 'application' : 'applications'}</p>
        {total === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            No applications yet
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {statusData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} stroke="hsl(var(--card))" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-foreground">{s.name}</span>
                  </div>
                  <span className="text-muted-foreground font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
