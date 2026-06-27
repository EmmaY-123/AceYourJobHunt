import { useState, useEffect, useCallback } from 'react';
import { backend } from '@/api/backendClient';
import { Plus, FileText, Paperclip } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ResumeCard from '@/components/ResumeCard';
import ResumeUploadDialog from '@/components/ResumeUploadDialog';
import SupplementaryDocumentCard from '@/components/SupplementaryDocumentCard';
import SupplementaryDocumentUploadDialog from '@/components/SupplementaryDocumentUploadDialog';

export default function ResumeLibrary() {
  const [resumes, setResumes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [suppDocs, setSuppDocs] = useState([]);
  const [suppUploadOpen, setSuppUploadOpen] = useState(false);
  const [suppDeleteTarget, setSuppDeleteTarget] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [resumeData, appData, suppData] = await Promise.all([
        backend.entities.Resume.list('-created_date', 200),
        backend.entities.Application.list('-updated_date', 200),
        backend.entities.SupplementaryDocument.list('-created_date', 200),
      ]);
      setResumes(resumeData);
      setApplications(appData);
      setSuppDocs(suppData);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await backend.entities.Resume.delete(deleteTarget.id);
    setDeleteTarget(null);
    await loadData();
  };

  const handleSuppDelete = async () => {
    if (!suppDeleteTarget) return;
    await backend.entities.SupplementaryDocument.delete(suppDeleteTarget.id);
    setSuppDeleteTarget(null);
    await loadData();
  };

  const appById = (id) => applications.find((a) => a.id === id) || null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Resume Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage resume versions and see which applications use them
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Upload Resume
        </button>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin px-6 pb-6">
        {/* Supplementary Documents */}
        {!loading && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Supplementary Documents</h2>
                <span className="text-xs text-muted-foreground">({suppDocs.length})</span>
              </div>
              <button
                onClick={() => setSuppUploadOpen(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Add Document
              </button>
            </div>
            {suppDocs.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No supplementary documents yet. Upload cover letters, reference lists, or other files and link them to an application.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppDocs.map((doc) => (
                  <SupplementaryDocumentCard
                    key={doc.id}
                    doc={doc}
                    application={appById(doc.application_id)}
                    onDelete={setSuppDeleteTarget}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Resumes */}
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-foreground">Resumes</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-semibold mb-1">No resumes yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Upload different versions of your resume to keep them organized and track which version you sent to each application.
            </p>
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Upload Your First Resume
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                applications={applications}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <ResumeUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSaved={loadData}
      />

      <SupplementaryDocumentUploadDialog
        open={suppUploadOpen}
        onClose={() => setSuppUploadOpen(false)}
        onSaved={loadData}
        applications={applications}
      />

      <AlertDialog open={!!suppDeleteTarget} onOpenChange={(v) => !v && setSuppDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              {suppDeleteTarget
                ? `This will permanently delete "${suppDeleteTarget.title}".`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuppDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently delete "${deleteTarget.title}" from your library. Applications that reference it will keep their attached file.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
