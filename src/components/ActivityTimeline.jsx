import { Label } from '@/components/ui/label';
import { STAGE_MAP, STAGE_DOT, getActivityDurations, formatDuration, formatDateTime } from './stages';

export default function ActivityTimeline({ activityLog }) {
  if (!activityLog || activityLog.length === 0) return null;

  const durations = getActivityDurations(activityLog);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">Activity Log</Label>
      <div className="bg-background border border-border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
        {durations.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full shrink-0 ${STAGE_DOT[entry.status] || 'bg-slate-400'}`} />
            <span className="font-medium text-foreground">{STAGE_MAP[entry.status]?.label || entry.status}</span>
            {entry.from && (
              <span className="text-muted-foreground/60 text-[11px]">
                from {STAGE_MAP[entry.from]?.label || entry.from}
              </span>
            )}
            <span className="text-muted-foreground/70 ml-auto text-[11px]">
              {formatDuration(entry.duration)}
            </span>
            <span className="text-muted-foreground/50 text-[11px] hidden sm:block">
              {formatDateTime(entry.entered_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
