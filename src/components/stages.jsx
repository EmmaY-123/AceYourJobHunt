import { Briefcase, Send, Users, Gift, CheckCircle2, CalendarClock } from 'lucide-react';

export const STAGES = [
  { key: 'wishlist', label: 'Wishlist', color: 'slate', icon: Briefcase },
  { key: 'applied', label: 'Applied', color: 'blue', icon: Send },
  { key: 'interviewing', label: 'Interviewing', color: 'amber', icon: Users },
  { key: 'offer', label: 'Offer', color: 'green', icon: Gift },
  { key: 'closed', label: 'Closed', color: 'red', icon: CheckCircle2 },
];

export const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.key, s]));

// Tailwind literal class maps (purge-safe)
export const STAGE_BADGE = {
  wishlist: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
  applied: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  interviewing: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  offer: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  closed: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
};

export const STAGE_DOT = {
  wishlist: 'bg-slate-400',
  applied: 'bg-blue-400',
  interviewing: 'bg-amber-400',
  offer: 'bg-emerald-400',
  closed: 'bg-rose-400',
};

export const STAGE_ACCENT = {
  wishlist: 'border-t-slate-500/60',
  applied: 'border-t-blue-500/60',
  interviewing: 'border-t-amber-500/60',
  offer: 'border-t-emerald-500/60',
  closed: 'border-t-rose-500/60',
};

export function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return null;
  }
}

export function isThisWeek(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

export function isUpcoming(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d >= new Date();
}

export function formatDuration(ms) {
  if (!ms || ms < 0) return '0m';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor(ms / (1000 * 60));
  if (days >= 1) return `${days}d`;
  if (hours >= 1) return `${hours}h`;
  return `${Math.max(1, mins)}m`;
}

export function getActivityDurations(activityLog) {
  if (!activityLog || activityLog.length === 0) return [];
  return activityLog.map((entry, idx) => {
    const enteredAt = new Date(entry.entered_at);
    const exitedAt = idx < activityLog.length - 1
      ? new Date(activityLog[idx + 1].entered_at)
      : new Date();
    return { ...entry, duration: exitedAt - enteredAt };
  });
}

export function getCurrentStageDuration(application) {
  const log = application.activity_log;
  let enteredAt;
  if (log && log.length > 0) {
    enteredAt = new Date(log[log.length - 1].entered_at);
  } else if (application.created_date) {
    enteredAt = new Date(application.created_date);
  } else {
    return null;
  }
  if (isNaN(enteredAt.getTime())) return null;
  return formatDuration(Date.now() - enteredAt.getTime());
}

export { CalendarClock };
