import { Briefcase, Send, Users, Gift, CheckCircle2, CalendarClock, TrendingUp } from 'lucide-react';
import { isThisWeek } from './stages';

export default function StatsBar({ applications }) {
  const total = applications.length;
  const upcomingThisWeek = applications.filter(
    (a) => a.interview_datetime && isThisWeek(a.interview_datetime) && new Date(a.interview_datetime) >= new Date()
  ).length;

  const stats = [
    { label: 'Total', value: total, icon: Briefcase, color: 'text-foreground' },
    { label: 'Wishlist', value: applications.filter((a) => (a.status || 'wishlist') === 'wishlist').length, icon: TrendingUp, color: 'text-slate-400' },
    { label: 'Applied', value: applications.filter((a) => a.status === 'applied').length, icon: Send, color: 'text-blue-400' },
    { label: 'Interviewing', value: applications.filter((a) => a.status === 'interviewing').length, icon: Users, color: 'text-amber-400' },
    { label: 'Offer', value: applications.filter((a) => a.status === 'offer').length, icon: Gift, color: 'text-emerald-400' },
    { label: 'Closed', value: applications.filter((a) => a.status === 'closed').length, icon: CheckCircle2, color: 'text-rose-400' },
    { label: 'Interviews this week', value: upcomingThisWeek, icon: CalendarClock, color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 px-6 pt-5 pb-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-card border border-border rounded-xl px-4 py-3 flex flex-col gap-1"
        >
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            <span className="text-[11px] font-medium uppercase tracking-wide truncate">{s.label}</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">{s.value}</span>
        </div>
      ))}
    </div>
  );
}
