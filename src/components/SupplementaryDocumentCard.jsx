import { FileText, ExternalLink, Trash2, Link2 } from 'lucide-react';

const TYPE_STYLES = {
  cover_letter: 'bg-blue-500/15 text-blue-600 border-blue-500/25',
  reference_list: 'bg-purple-500/15 text-purple-600 border-purple-500/25',
  other: 'bg-slate-500/15 text-slate-600 border-slate-500/25',
};

const TYPE_LABELS = {
  cover_letter: 'Cover Letter',
  reference_list: 'Reference List',
  other: 'Other',
};

export default function SupplementaryDocumentCard({ doc, application, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
            <FileText className="w-4.5 h-4.5 text-primary" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{doc.title}</h3>
            <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${TYPE_STYLES[doc.doc_type] || TYPE_STYLES.other}`}>
              {TYPE_LABELS[doc.doc_type] || doc.doc_type}
            </span>
          </div>
        </div>
        <button
          onClick={() => onDelete(doc)}
          className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {application && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link2 className="w-3.5 h-3.5" />
          <span className="truncate">{application.company_name} — {application.job_title}</span>
        </div>
      )}

      <a
        href={doc.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-sm text-primary hover:underline mt-auto"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        {doc.file_name || 'View document'}
      </a>
    </div>
  );
}
