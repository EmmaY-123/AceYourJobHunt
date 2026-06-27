import { useState, useEffect } from 'react';
import { backend } from '@/api/backendClient';
import { CalendarClock, ExternalLink, Briefcase, ChevronRight } from 'lucide-react';
import { STAGE_BADGE, STAGE_MAP, formatDateTime, formatDate } from '@/components/stages';

export default function Interviews() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await backend.entities.Application.list('-updated_date', 200);
        setApplications(data);
      } catch (err) {
        console.error('Failed to load applications', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const withInterviews = applications
    .filter((a) => a.interview_datetime)
    .sort((a, b) => new Date(a.interview_datetime) - new Date(b.interview_datetime));

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(startOfToday.getDate() + 1);
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(startOfToday.getDate() + 7);

  const groups = {
    past: [],
    today: [],
    week: [],
    later: [],
  };

  withInterviews.forEach((app) => {
    const d = new Date(app.interview_datetime);
    if (d < startOfToday) groups.past.push(app);
    else if (d < endOfToday) groups.today.push(app);
    else if (d < endOfWeek) groups.week.push(app);
    else groups.later.push(app);
  });

  const groupConfig = [
    { key: 'today', label: 'Today', empty: 'No interviews today' },
    { key: 'week', label: 'This Week', empty: 'No interviews this week' },
    { key: 'later', label: 'Upcoming', empty: 'No upcoming interviews' },
    { key: 'past', label: 'Past Interviews', empty: 'No past interviews' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <h1 className="text-xl font-bold tracking-tight">Interviews</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All your scheduled interviews in one place
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 pb-8">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : withInterviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <CalendarClock className="w-8 h-8 text-primary" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-semibold mb-1">No interviews scheduled</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              When you add an interview date to an application, it'll show up here organized by date.
            </p>
          </div>
        ) : (
          <div className="space-y-8 max-w-3xl">
            {groupConfig.map((group) => {
              const items = groups[group.key];
              if (items.length === 0) return null;
              return (
                <div key={group.key}>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </h2>
                    <span className="text-xs text-muted-foreground/60 bg-muted/40 px-1.5 py-0.5 rounded-md">
                      {items.length}
                    </span>
                    <div className="flex-1 h-px bg-border ml-2" />
                  </div>
                  <div className="space-y-2.5">
                    {items.map((app) => {
                      const stage = STAGE_MAP[app.status] || STAGE_MAP.wishlist;
                      const d = new Date(app.interview_datetime);
                      const isPast = d < startOfToday;
                      return (
                        <div
                          key={app.id}
                          className={`group flex items-center gap-4 bg-card border border-border rounded-xl p-4 transition-all hover:border-primary/40 ${
                            isPast ? 'opacity-60' : ''
                          }`}
                        >
                          {/* Date block */}
                          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-secondary border border-border shrink-0">
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                              {d.toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-xl font-bold text-foreground leading-none">
                              {d.getDate()}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm text-foreground truncate">
                                {app.company_name}
                              </h3>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${STAGE_BADGE[app.status] || STAGE_BADGE.wishlist}`}>
                                {stage.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {app.job_title}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground/70">
                              <span className="flex items-center gap-1">
                                <CalendarClock className="w-3 h-3" />
                                {formatDateTime(app.interview_datetime)}
                              </span>
                              {app.date_applied && (
                                <span className="flex items-center gap-1">
                                  <Briefcase className="w-3 h-3" />
                                  Applied {formatDate(app.date_applied)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Link */}
                          {app.job_url && (
                            <a
                              href={app.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="Open job posting"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
