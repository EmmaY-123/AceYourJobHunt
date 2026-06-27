import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Archive, RotateCcw, Briefcase } from 'lucide-react';
import { STAGE_BADGE, STAGE_MAP, formatDate } from '@/components/stages';

export default function Archived() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadApplications = useCallback(async () => {
    try {
      const data = await base44.entities.Application.list('-updated_date', 200);
      setApplications(data.filter((a) => a.archived));
    } catch (err) {
      console.error('Failed to load archived applications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleRestore = async (app) => {
    await base44.entities.Application.update(app.id, { archived: false });
    await loadApplications();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-4">
        <h1 className="text-xl font-bold tracking-tight">Archived</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Applications you've archived — restore them to your board anytime
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 pb-8">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Archive className="w-8 h-8 text-primary" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-semibold mb-1">No archived applications</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Archived applications will appear here. You can restore them to your board whenever you're ready.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-w-3xl">
            {applications.map((app) => {
              const stage = STAGE_MAP[app.status] || STAGE_MAP.wishlist;
              return (
                <div
                  key={app.id}
                  className="group flex items-center gap-4 bg-card border border-border rounded-xl p-4 transition-all hover:border-primary/40"
                >
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
                    {app.date_applied && (
                      <p className="text-[11px] text-muted-foreground/60 mt-1.5 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        Applied {formatDate(app.date_applied)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRestore(app)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
