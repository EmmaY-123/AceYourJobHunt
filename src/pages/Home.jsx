import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Search, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import KanbanBoard from '@/components/KanbanBoard';
import StatsBar from '@/components/StatsBar';
import ChartsSection from '@/components/ChartsSection';
import ApplicationFormDialog from '@/components/ApplicationFormDialog';
import ApplicationDetailDialog from '@/components/ApplicationDetailDialog';

export default function Home() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('wishlist');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailApp, setDetailApp] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_applied_desc');

  const loadApplications = useCallback(async () => {
    try {
      const data = await base44.entities.Application.list('-updated_date', 200);
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const app = applications.find((a) => a.id === draggableId);
    if (!app || app.status === newStatus) return;

    const newEntry = { status: newStatus, from: app.status, entered_at: new Date().toISOString() };
    const updatedLog = [...(app.activity_log || []), newEntry];

    // Optimistic update
    setApplications((prev) =>
      prev.map((a) => (a.id === draggableId ? { ...a, status: newStatus, activity_log: updatedLog } : a))
    );

    try {
      await base44.entities.Application.update(draggableId, { status: newStatus, activity_log: updatedLog });
    } catch (err) {
      // Revert on failure
      setApplications((prev) =>
        prev.map((a) => (a.id === draggableId ? { ...a, status: app.status, activity_log: app.activity_log } : a))
      );
      console.error('Failed to update status', err);
    }
  };

  const handleCardClick = (app) => {
    setDetailApp(app);
    setDetailOpen(true);
  };

  const handleEditFromDetail = (app) => {
    setDetailOpen(false);
    setEditingApp(app);
    setDefaultStatus(app.status);
    setDialogOpen(true);
  };

  const handleDelete = async (app) => {
    await base44.entities.Application.delete(app.id);
    setDetailOpen(false);
    await loadApplications();
  };

  const handleUpdatePrep = async (app, prepText) => {
    await base44.entities.Application.update(app.id, { interview_prep: prepText });
    setDetailApp({ ...app, interview_prep: prepText });
    await loadApplications();
  };

  const handleAddToStage = (stage) => {
    setEditingApp(null);
    setDefaultStatus(stage);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingApp(null);
    setDefaultStatus('wishlist');
    setDialogOpen(true);
  };

  const handleSave = async (payload) => {
    if (editingApp) {
      if (payload.status !== editingApp.status) {
        const newEntry = { status: payload.status, from: editingApp.status, entered_at: new Date().toISOString() };
        payload.activity_log = [...(editingApp.activity_log || []), newEntry];
      }
      await base44.entities.Application.update(editingApp.id, payload);
    } else {
      payload.activity_log = [{ status: payload.status, from: null, entered_at: new Date().toISOString() }];
      await base44.entities.Application.create(payload);
    }
    await loadApplications();
  };

  const handleArchive = async (app) => {
    await base44.entities.Application.update(app.id, { archived: true });
    setDialogOpen(false);
    await loadApplications();
  };

  const activeApplications = applications.filter((a) => !a.archived);
  const searchedApplications = search.trim()
    ? activeApplications.filter((a) => {
        const q = search.toLowerCase().trim();
        return (
          (a.company_name || '').toLowerCase().includes(q) ||
          (a.job_title || '').toLowerCase().includes(q)
        );
      })
    : activeApplications;

  const filteredApplications = [...searchedApplications].sort((a, b) => {
    switch (sortBy) {
      case 'date_applied_desc':
        return new Date(b.date_applied || b.created_date) - new Date(a.date_applied || a.created_date);
      case 'date_applied_asc':
        return new Date(a.date_applied || a.created_date) - new Date(b.date_applied || b.created_date);
      case 'updated_desc':
        return new Date(b.updated_date) - new Date(a.updated_date);
      case 'company_asc':
        return (a.company_name || '').localeCompare(b.company_name || '');
      default:
        return 0;
    }
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Job Hunt Board</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Drag cards across stages to update your progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company or role..."
              className="w-48 sm:w-56 bg-background border border-border rounded-lg pl-9 pr-8 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] bg-background border-border h-9 text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="date_applied_desc">Date Applied (Newest)</SelectItem>
              <SelectItem value="date_applied_asc">Date Applied (Oldest)</SelectItem>
              <SelectItem value="updated_desc">Recently Updated</SelectItem>
              <SelectItem value="company_asc">Company (A-Z)</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add Application
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar applications={applications} />

      {/* Charts */}
      {!loading && applications.length > 0 && (
        <ChartsSection applications={applications} />
      )}

      {/* Board */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-primary" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-semibold mb-1">Start your job hunt</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Add your first application to start tracking your progress. You can organize it across stages as you move through the process.
            </p>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Add Your First Application
            </button>
          </div>
        ) : (
          <KanbanBoard
            applications={filteredApplications}
            onCardClick={handleCardClick}
            onDragEnd={handleDragEnd}
            onAddToStage={handleAddToStage}
          />
        )}
      </div>

      <ApplicationFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onArchive={handleArchive}
        application={editingApp}
        defaultStatus={defaultStatus}
      />

      <ApplicationDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEditFromDetail}
        onDelete={handleDelete}
        onUpdate={handleUpdatePrep}
        application={detailApp}
      />
    </div>
  );
}
