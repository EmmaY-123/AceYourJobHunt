import { FileText, Trash2, Briefcase, ExternalLink } from 'lucide-react';
import { formatDate } from './stages';

export default function ResumeCard({ resume, applications, onDelete }) {
  const linkedApps = applications.filter((a) => a.resume_url === resume.file_url);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-black/10">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
            <FileText className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{resume.title}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{resume.file_name}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(resume)}
          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
          title="Delete resume"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {resume.notes && (
        <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">{resume.notes}</p>
      )}

      <div className="text-[11px] text-muted-foreground/60">
        Added {formatDate(resume.created_date)}
      </div>

      {linkedApps.length > 0 && (
        <div className="pt-2 border-t border-border/40 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wide">
            Used by {linkedApps.length} {linkedApps.length === 1 ? 'application' : 'applications'}
          </p>
          {linkedApps.map((app) => (
            <div key={app.id} className="flex items-center gap-1.5 text-xs text-foreground">
              <Briefcase className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="truncate font-medium">{app.company_name}</span>
              <span className="text-muted-foreground/50 truncate">· {app.job_title}</span>
            </div>
          ))}
        </div>
      )}

      <a
        href={resume.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <ExternalLink className="w-3 h-3" />
        View Resume
      </a>
    </div>
  );
}
