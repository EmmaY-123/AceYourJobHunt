import { Sparkles, ExternalLink, AlertTriangle, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ResumeMatchCard({ match, loading, error, onDismiss }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg p-2.5">
        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
        Fetching job info and matching resume...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1">{error}</span>
        <button
          onClick={onDismiss}
          className="text-amber-600/70 hover:text-amber-600 dark:text-amber-400/70 dark:hover:text-amber-400 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (!match) return null;

  return (
    <div className="flex items-start gap-2 text-xs bg-primary/5 border border-primary/20 rounded-lg p-2.5">
      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-foreground leading-relaxed">
          <span className="font-semibold">Recommended Resume:</span>{' '}
          <span className="text-primary font-medium">{match.resumeTitle}</span>
          {match.reason && <span className="text-muted-foreground"> — {match.reason}</span>}
          {match.score != null && (
            <span className="text-muted-foreground"> · Match score: {match.score}%</span>
          )}
        </p>
      </div>
      <button
        onClick={() => navigate('/resume-library')}
        className="flex items-center gap-1 text-primary hover:underline shrink-0 font-medium mt-0.5"
      >
        <ExternalLink className="w-3 h-3" />
        View Resume
      </button>
    </div>
  );
}
