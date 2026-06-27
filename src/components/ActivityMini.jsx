import { Clock } from 'lucide-react';
import { STAGE_MAP, getCurrentStageDuration, getActivityDurations, formatDuration } from './stages';

export default function ActivityMini({ application }) {
  const currentDuration = getCurrentStageDuration(application);
  if (!currentDuration) return null;

  const log = application.activity_log;
  const durations = log && log.length > 0 ? getActivityDurations(log) : [];
  const recent = durations.slice(-3);
  const showProgression = recent.length > 1;

  return (
    <div className="pt-2 mt-1 border-t border-border/40 space-y-1">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
        <Clock className="w-2.5 h-2.5" />
        <span>{currentDuration} in {STAGE_MAP[application.status]?.label || application.status}</span>
      </div>
      {showProgression && (
        <div className="flex items-center gap-0.5 flex-wrap text-[9px] text-muted-foreground/50">
          {recent.map((entry, idx) => (
            <span key={idx} className="flex items-center gap-0.5">
              <span>{STAGE_MAP[entry.status]?.label || entry.status}</span>
              {idx < recent.length - 1 && (
                <span className="text-muted-foreground/40">{formatDuration(entry.duration)}</span>
              )}
              {idx < recent.length - 1 && <span className="mx-0.5">→</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
