import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Loader2, FileText, X } from 'lucide-react';
import { backend } from '@/api/backendClient';

const DOC_TYPES = [
  { value: 'cover_letter', label: 'Cover Letter' },
  { value: 'reference_list', label: 'Reference List' },
  { value: 'other', label: 'Other' },
];

export default function SupplementaryDocumentUploadDialog({ open, onClose, onSaved, applications }) {
  const [form, setForm] = useState({ title: '', doc_type: 'cover_letter', application_id: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ title: '', doc_type: 'cover_letter', application_id: '' });
      setFile(null);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !file) return;
    setSaving(true);
    try {
      setUploading(true);
      const { file_url } = await backend.integrations.Core.UploadFile({ file });
      setUploading(false);
      await backend.entities.SupplementaryDocument.create({
        title: form.title.trim(),
        file_url,
        file_name: file.name,
        doc_type: form.doc_type,
        application_id: form.application_id || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to upload document', err);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Upload Supplementary Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Title <span className="text-primary">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Cover Letter — Acme Corp"
              className="bg-background border-border"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Document Type</Label>
            <Select
              value={form.doc_type}
              onValueChange={(v) => setForm((p) => ({ ...p, doc_type: v }))}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Linked Application (optional)</Label>
            <Select
              value={form.application_id || 'none'}
              onValueChange={(v) => setForm((p) => ({ ...p, application_id: v === 'none' ? '' : v }))}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-60">
                <SelectItem value="none">None</SelectItem>
                {applications.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.company_name} — {app.job_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              File <span className="text-primary">*</span>
            </Label>
            {file ? (
              <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-2.5">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 bg-background border border-dashed border-border rounded-lg p-2.5 cursor-pointer hover:border-primary/40 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">Click to select a file (PDF, DOCX)</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !form.title.trim() || !file}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {uploading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {saving ? 'Saving...' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
