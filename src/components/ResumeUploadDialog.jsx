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
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2, FileText, X } from 'lucide-react';
import { backend } from '@/api/backendClient';

export default function ResumeUploadDialog({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', notes: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ title: '', notes: '' });
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
      await backend.entities.Resume.create({
        title: form.title.trim(),
        file_url,
        file_name: file.name,
        notes: form.notes.trim(),
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to upload resume', err);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Upload Resume Version</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Title <span className="text-primary">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Frontend Engineer v2"
              className="bg-background border-border"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Resume File <span className="text-primary">*</span>
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
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="What's this version tailored for?"
              className="bg-background border-border min-h-[80px] resize-y"
            />
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
              {saving ? 'Saving...' : 'Upload Resume'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
