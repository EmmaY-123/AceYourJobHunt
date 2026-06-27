import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  FileText,
  Pencil,
  Trash2,
  Calendar,
  CalendarClock,
  Link as LinkIcon,
  StickyNote,
  BookOpen,
} from 'lucide-react';
import { STAGE_MAP, STAGE_BADGE, formatDate, formatDateTime } from './stages';
import ActivityTimeline from './ActivityTimeline';

export default function ApplicationDetailDialog({ open, onClose, onEdit, onDelete, onUpdate, application }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [prepText, setPrepText] = useState('');
  const [savingPrep, setSavingPrep] = useState(false);

  useEffect(() => {
    setPrepText(application?.interview_prep || '');
  }, [application?.id, application?.interview_prep]);

  if (!application) return null;

  const app = application;

  const handleSavePrep = async () => {
    setSavingPrep(true);
    try {
      await onUpdate?.(app, prepText);
    } finally {
      setSavingPrep(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[560px] bg-card border-border max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-bold truncate">{app.company_name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{app.job_title}</p>
            </div>
            <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border ${STAGE_BADGE[app.status] || 'bg-slate-500/15 text-slate-300 border-slate-500/25'}`}>
              {STAGE_MAP[app.status]?.label || app.status}
            </span>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="pt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4 mt-4">
          {app.job_url && (
            <DetailRow icon={LinkIcon} label="Job Posting URL">
              <a href={app.job_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm break-all">
                {app.job_url} <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </DetailRow>
          )}

          {app.date_applied && (
            <DetailRow icon={Calendar} label="Date Applied">
              <span className="text-sm text-foreground">{formatDate(app.date_applied)}</span>
            </DetailRow>
          )}

          {app.interview_datetime && (
            <DetailRow icon={CalendarClock} label="Interview Date & Time">
              <span className="text-sm text-foreground">{formatDateTime(app.interview_datetime)}</span>
            </DetailRow>
          )}

          {app.resume_url && (
            <DetailRow icon={FileText} label="Resume">
              <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                {app.resume_name || 'View resume'} <ExternalLink className="w-3 h-3" />
              </a>
            </DetailRow>
          )}

          {app.description && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <StickyNote className="w-3.5 h-3.5" />
                Description / Notes
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-background border border-border rounded-lg p-3">
                {app.description}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5" />
              Interview Prep
            </div>
            <textarea
              value={prepText}
              onChange={(e) => setPrepText(e.target.value)}
              placeholder="Company research, talking points, questions to ask..."
              className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground/90 placeholder:text-muted-foreground/50 min-h-[120px] resize-y focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSavePrep}
                disabled={savingPrep || prepText === (app.interview_prep || '')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-8"
              >
                {savingPrep ? 'Saving...' : 'Save Prep Notes'}
              </Button>
            </div>
          </div>

          </TabsContent>
          <TabsContent value="history" className="mt-4">
            {app.activity_log?.length > 0 ? (
              <ActivityTimeline activityLog={app.activity_log} />
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No status changes recorded yet.
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-2 pt-2">
          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this application?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the application for {app.company_name}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => { setConfirmDelete(false); onDelete(app); }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              Close
            </Button>
            <Button onClick={() => onEdit(app)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Pencil className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
