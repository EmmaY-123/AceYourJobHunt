import { CalendarClock, ExternalLink, FileText } from 'lucide-react';
import { STAGE_DOT, formatDateTime, isUpcoming } from './stages';
import ActivityMini from './ActivityMini';

export default function ApplicationCard({ application, onClick, provided, snapshot }) {
  const hasInterview = !!application.interview_datetime;
  const interviewUpcoming = hasInterview && isUpcoming(application.interview_datetime);

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      onClick={onClick}
      style={{
        ...provided?.draggableProps?.style,
        cursor: 'pointer',
        transform: snapshot?.isDragging
          ? `${provided?.draggableProps?.style?.transform || ''} rotate(2deg)`
          : provided?.draggableProps?.style?.transform,
      }}
      className={`group bg-card border border-border rounded-xl p-3.5 space-y-2.5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-black/20 ${
        snapshot?.isDragging ? 'shadow-2xl shadow-black/40 border-primary/50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-foreground truncate leading-snug">
            {application.company_name}
          </h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {application.job_title}
          </p>
        </div>
        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${STAGE_DOT[application.status] || 'bg-slate-400'}`} />
      </div>

      {application.description && (
        <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
          {application.description}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground/70">
        {hasInterview && (
          <span className={`flex items-center gap-1 ${interviewUpcoming ? 'text-amber-300/90' : 'text-muted-foreground/60'}`}>
            <CalendarClock className="w-3 h-3" />
            {formatDateTime(application.interview_datetime)}
          </span>
        )}
        {application.resume_url && (
          <span className="flex items-center gap-1" title="Resume attached">
            <FileText className="w-3 h-3 text-primary/70" />
          </span>
        )}
        {application.job_url && (
          <span className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-3 h-3" />
            Link
          </span>
        )}
      </div>

      <ActivityMini application={application} />
    </div>
  );
}
