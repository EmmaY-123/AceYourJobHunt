import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STAGES } from './stages';
import ActivityTimeline from './ActivityTimeline';
import ResumeMatchCard from './ResumeMatchCard';
import { Archive, FileText, Upload, Loader2, X } from 'lucide-react';
import { backend } from '@/api/backendClient';

export default function ApplicationFormDialog({ open, onClose, onSave, onArchive, application, defaultStatus, initialData }) {
  const isEdit = !!application;
  const [form, setForm] = useState({
    company_name: '',
    job_title: '',
    description: '',
    job_url: '',
    status: 'wishlist',
    interview_datetime: '',
    date_applied: '',
    resume_url: '',
    resume_name: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlFetch, setUrlFetch] = useState({ loading: false, error: null, match: null });
  const urlRef = useRef('');
  const captureRef = useRef('');

  useEffect(() => {
    if (open) {
      if (application) {
        // Convert datetime-local format
        let interviewVal = '';
        if (application.interview_datetime) {
          const d = new Date(application.interview_datetime);
          if (!isNaN(d.getTime())) {
            interviewVal = d.toISOString().slice(0, 16);
          }
        }
        setForm({
          company_name: application.company_name || '',
          job_title: application.job_title || '',
          description: application.description || '',
          job_url: application.job_url || '',
          status: application.status || 'wishlist',
          interview_datetime: interviewVal,
          date_applied: application.date_applied || '',
          resume_url: application.resume_url || '',
          resume_name: application.resume_name || '',
        });
        urlRef.current = application.job_url || '';
        setUrlFetch({ loading: false, error: null, match: null });
      } else {
        setForm({
          company_name: initialData?.company_name || '',
          job_title: initialData?.job_title || '',
          description: initialData?.description || '',
          job_url: initialData?.job_url || '',
          status: initialData?.status || defaultStatus || 'wishlist',
          interview_datetime: '',
          date_applied: initialData?.date_applied || new Date().toISOString().slice(0, 10),
          resume_url: '',
          resume_name: '',
        });
        urlRef.current = initialData?.job_url || '';
        setUrlFetch({ loading: false, error: null, match: null });
      }
    }
  }, [open, application, defaultStatus, initialData]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await backend.integrations.Core.UploadFile({ file });
      setForm((prev) => ({ ...prev, resume_url: file_url, resume_name: file.name }));
    } catch (err) {
      console.error('Failed to upload resume', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveResume = () => {
    setForm((prev) => ({ ...prev, resume_url: '', resume_name: '' }));
  };

  const applyJobInfo = async (jobInfo, { overwrite = false } = {}) => {
    setForm((prev) => ({
      ...prev,
      company_name: overwrite ? jobInfo.company_name || prev.company_name : prev.company_name.trim() || jobInfo.company_name || '',
      job_title: overwrite ? jobInfo.job_title || prev.job_title : prev.job_title.trim() || jobInfo.job_title || '',
      description: overwrite ? jobInfo.description || prev.description : prev.description.trim() || jobInfo.description || '',
    }));

    if (jobInfo.description) {
      await matchResume(jobInfo.description);
    } else {
      setUrlFetch({ loading: false, error: null, match: null });
    }
  };

  const handleCapturedJob = async (capture) => {
    setUrlFetch({ loading: true, error: null, match: null });
    try {
      const jobInfo = await backend.integrations.Core.InvokeLLM({
        prompt: `Clean this captured browser text from a job posting page.

URL: ${capture.url || ''}
Page title: ${capture.pageTitle || ''}
Possible company from structured data: ${capture.company || ''}
Possible job title from structured data: ${capture.title || ''}

Raw captured text:
${capture.description || ''}

Return JSON with:
- company_name: the real employer or hiring brand, not the page vendor
- job_title: the specific active job title from the current URL/page, not a generic page title
- description: a readable, sectioned job description in the source language

Rules:
- Do not dump navigation, breadcrumbs, buttons, duplicate text, or unrelated job cards.
- If the page contains multiple directions under one posting, keep them under clear headings.
- Use line breaks and labels like 职位描述, 招聘方向, 工作职责, 任职要求, 工作地点 when present.
- If the URL/page title says DeepSeek招聘 and the posting content says DeepSeek, company_name should be DeepSeek.`,
        response_json_schema: {
          type: 'object',
          properties: {
            company_name: { type: 'string' },
            job_title: { type: 'string' },
            description: { type: 'string' },
          },
        },
      });

      await applyJobInfo(jobInfo, { overwrite: true });
    } catch (err) {
      console.error('Failed to clean captured job info', err);
      setUrlFetch({ loading: false, error: 'Could not clean captured job info', match: null });
    }
  };

  const handleUrlFetch = async (url) => {
    setUrlFetch({ loading: true, error: null, match: null });
    try {
      const jobInfo = await backend.integrations.Core.InvokeLLM({
        prompt: `Extract the company name, job title, and the full job description from this job posting URL: ${url}. Return the information as JSON.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            company_name: { type: 'string' },
            job_title: { type: 'string' },
            description: { type: 'string' },
          },
        },
      });

      await applyJobInfo(jobInfo);
    } catch (err) {
      console.error('Failed to fetch job info', err);
      setUrlFetch({ loading: false, error: 'Could not fetch job info from this URL', match: null });
    }
  };

  const matchResume = async (jobDescription) => {
    try {
      const resumes = await backend.entities.Resume.list('-created_date', 50);
      if (!resumes || resumes.length === 0) {
        setUrlFetch({ loading: false, error: null, match: null });
        return;
      }

      const resumeList = resumes.map((r, i) => `${i + 1}. ${r.title}`).join('\n');

      const result = await backend.integrations.Core.InvokeLLM({
        prompt: `Given this job description, which resume version is the best match and why?\n\nJob Description:\n${jobDescription}\n\nResume versions available:\n${resumeList}\n\nReturn the best match with a reason and a match score from 0 to 100.`,
        file_urls: resumes.map((r) => r.file_url),
        response_json_schema: {
          type: 'object',
          properties: {
            bestMatch: { type: 'string' },
            reason: { type: 'string' },
            score: { type: 'number' },
          },
        },
      });

      const matchedResume = resumes.find(
        (r) =>
          r.title === result.bestMatch ||
          r.title.includes(result.bestMatch) ||
          result.bestMatch.includes(r.title)
      );

      setUrlFetch({
        loading: false,
        error: null,
        match: {
          bestMatch: result.bestMatch,
          reason: result.reason,
          score: result.score,
          resumeId: matchedResume?.id,
          resumeTitle: matchedResume?.title || result.bestMatch,
        },
      });
    } catch (err) {
      console.error('Failed to match resume', err);
      setUrlFetch({ loading: false, error: 'Could not match resume from library', match: null });
    }
  };

  useEffect(() => {
    const url = form.job_url.trim();
    if (!url || !url.startsWith('http') || url === urlRef.current) return;
    urlRef.current = url;
    const timeout = setTimeout(() => handleUrlFetch(url), 1000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.job_url]);

  useEffect(() => {
    if (!open || !initialData?.raw_capture) return;

    const key = `${initialData.raw_capture.url || ''}:${initialData.raw_capture.description || ''}`.slice(0, 500);
    if (key === captureRef.current) return;
    captureRef.current = key;
    handleCapturedJob(initialData.raw_capture);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.job_title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        company_name: form.company_name.trim(),
        job_title: form.job_title.trim(),
        interview_datetime: form.interview_datetime ? new Date(form.interview_datetime).toISOString() : '',
      };
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[560px] bg-card border-border max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isEdit ? 'Edit Application' : 'New Application'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="company_name" className="text-xs font-medium text-muted-foreground">
                Company <span className="text-primary">*</span>
              </Label>
              <Input
                id="company_name"
                value={form.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                placeholder="e.g. Stripe"
                className="bg-background border-border"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job_title" className="text-xs font-medium text-muted-foreground">
                Job Title <span className="text-primary">*</span>
              </Label>
              <Input
                id="job_title"
                value={form.job_title}
                onChange={(e) => handleChange('job_title', e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="bg-background border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job_url" className="text-xs font-medium text-muted-foreground">
              Job Posting URL
            </Label>
            <Input
              id="job_url"
              value={form.job_url}
              onChange={(e) => handleChange('job_url', e.target.value)}
              placeholder="https://..."
              className="bg-background border-border"
            />
            {(urlFetch.loading || urlFetch.error || urlFetch.match) && (
              <ResumeMatchCard
                match={urlFetch.match}
                loading={urlFetch.loading}
                error={urlFetch.error}
                onDismiss={() => setUrlFetch({ loading: false, error: null, match: null })}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium text-muted-foreground">
              Job Description / Notes
            </Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Paste the job description, your notes, or key details..."
              className="bg-background border-border min-h-[120px] resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {STAGES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date_applied" className="text-xs font-medium text-muted-foreground">
                Date Applied
              </Label>
              <Input
                id="date_applied"
                type="date"
                value={form.date_applied}
                onChange={(e) => handleChange('date_applied', e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="interview_datetime" className="text-xs font-medium text-muted-foreground">
              Interview Date & Time
            </Label>
            <Input
              id="interview_datetime"
              type="datetime-local"
              value={form.interview_datetime}
              onChange={(e) => handleChange('interview_datetime', e.target.value)}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Resume</Label>
            {form.resume_url ? (
              <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-2.5">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <a
                  href={form.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground hover:text-primary truncate flex-1"
                >
                  {form.resume_name || 'View resume'}
                </a>
                <button
                  type="button"
                  onClick={handleRemoveResume}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 bg-background border border-dashed border-border rounded-lg p-2.5 cursor-pointer hover:border-primary/40 transition-colors">
                {uploading ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                ) : (
                  <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Uploading...' : 'Click to upload resume (PDF, DOCX)'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {isEdit && application?.activity_log?.length > 0 && (
            <ActivityTimeline activityLog={application.activity_log} />
          )}

          <DialogFooter className="pt-2 gap-2">
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onArchive?.(application)}
                className="text-muted-foreground hover:text-foreground mr-auto"
              >
                <Archive className="w-4 h-4 mr-1.5" />
                Archive
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !form.company_name.trim() || !form.job_title.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
