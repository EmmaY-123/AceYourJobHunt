import { useState, useEffect, useCallback } from 'react';
import { backend } from '@/api/backendClient';
import { Search, X, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { STAGE_MAP, STAGE_BADGE, formatDate, formatDateTime } from '@/components/stages';
import ApplicationDetailDialog from '@/components/ApplicationDetailDialog';
import ApplicationFormDialog from '@/components/ApplicationFormDialog';

const DETAIL_ID_KEY = 'acejob_open_application_id';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('date_applied');
  const [sortDir, setSortDir] = useState('desc');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailApp, setDetailApp] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('wishlist');

  const loadApplications = useCallback(async () => {
    try {
      const data = await backend.entities.Application.list('-updated_date', 500);
      setApplications(data.filter((a) => !a.archived));
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    if (loading || detailOpen || dialogOpen) return;
    const id = sessionStorage.getItem(DETAIL_ID_KEY);
    if (!id) return;
    const app = applications.find((a) => a.id === id);
    if (!app) return;
    setDetailApp(app);
    setDetailOpen(true);
  }, [applications, loading, detailOpen, dialogOpen]);

  const handleRowClick = (app) => {
    sessionStorage.setItem(DETAIL_ID_KEY, app.id);
    setDetailApp(app);
    setDetailOpen(true);
  };

  const handleDetailClose = () => {
    sessionStorage.removeItem(DETAIL_ID_KEY);
    setDetailOpen(false);
  };

  const handleEditFromDetail = (app) => {
    setDetailOpen(false);
    setEditingApp(app);
    setDefaultStatus(app.status);
    setDialogOpen(true);
  };

  const handleDelete = async (app) => {
    await backend.entities.Application.delete(app.id);
    sessionStorage.removeItem(DETAIL_ID_KEY);
    setDetailOpen(false);
    await loadApplications();
  };

  const handleUpdatePrep = async (app, prepText) => {
    await backend.entities.Application.update(app.id, { interview_prep: prepText });
    setDetailApp({ ...app, interview_prep: prepText });
    await loadApplications();
  };

  const handleSave = async (payload) => {
    if (editingApp) {
      if (payload.status !== editingApp.status) {
        const newEntry = { status: payload.status, from: editingApp.status, entered_at: new Date().toISOString() };
        payload.activity_log = [...(editingApp.activity_log || []), newEntry];
      }
      await backend.entities.Application.update(editingApp.id, payload);
    } else {
      payload.activity_log = [{ status: payload.status, from: null, entered_at: new Date().toISOString() }];
      await backend.entities.Application.create(payload);
    }
    await loadApplications();
  };

  const handleArchive = async (app) => {
    await backend.entities.Application.update(app.id, { archived: true });
    setDialogOpen(false);
    await loadApplications();
  };

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const searched = search.trim()
    ? applications.filter((a) => {
        const q = search.toLowerCase().trim();
        return (
          (a.company_name || '').toLowerCase().includes(q) ||
          (a.job_title || '').toLowerCase().includes(q)
        );
      })
    : applications;

  const sorted = [...searched].sort((a, b) => {
    let av, bv;
    switch (sortKey) {
      case 'company_name':
        av = (a.company_name || '').toLowerCase();
        bv = (b.company_name || '').toLowerCase();
        break;
      case 'job_title':
        av = (a.job_title || '').toLowerCase();
        bv = (b.job_title || '').toLowerCase();
        break;
      case 'status':
        av = a.status || '';
        bv = b.status || '';
        break;
      case 'interview_datetime':
        av = a.interview_datetime || '';
        bv = b.interview_datetime || '';
        break;
      case 'date_applied':
      default:
        av = a.date_applied || a.created_date;
        bv = b.date_applied || b.created_date;
        break;
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const columns = [
    { key: 'company_name', label: 'Company' },
    { key: 'job_title', label: 'Job Title' },
    { key: 'status', label: 'Status' },
    { key: 'date_applied', label: 'Date Applied' },
    { key: 'interview_datetime', label: 'Interview' },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">All Applications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sorted.length} {sorted.length === 1 ? 'application' : 'applications'} · click a column to sort
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or role..."
            className="w-56 bg-background border border-border rounded-lg pl-9 pr-8 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
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
      </div>

      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <p className="text-sm text-muted-foreground">
              {search ? 'No applications match your search.' : 'No applications yet.'}
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    {columns.map((col) => (
                      <TableHead key={col.key}>
                        <button
                          onClick={() => toggleSort(col.key)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {col.label}
                          <SortIcon col={col.key} />
                        </button>
                      </TableHead>
                    ))}
                    <TableHead className="text-xs font-semibold text-muted-foreground">Resume</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((app) => (
                    <TableRow key={app.id} className="hover:bg-accent/40 cursor-pointer" onClick={() => handleRowClick(app)}>
                      <TableCell className="font-medium text-foreground whitespace-nowrap">
                        {app.company_name}
                      </TableCell>
                      <TableCell className="text-foreground/90 whitespace-nowrap">
                        {app.job_title}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STAGE_BADGE[app.status] || 'bg-slate-500/15 text-slate-600 border-slate-500/25'}`}>
                          {STAGE_MAP[app.status]?.label || app.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {app.date_applied ? formatDate(app.date_applied) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {app.interview_datetime ? formatDateTime(app.interview_datetime) : '—'}
                      </TableCell>
                      <TableCell>
                        {app.resume_url ? (
                          <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                            <FileText className="w-3.5 h-3.5" />
                            {app.resume_name || 'View'}
                          </a>
                        ) : (
                          <span className="text-muted-foreground/40 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.job_url ? (
                          <a href={app.job_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center text-sm">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground/40 text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <ApplicationDetailDialog
        open={detailOpen}
        onClose={handleDetailClose}
        onEdit={handleEditFromDetail}
        onDelete={handleDelete}
        onUpdate={handleUpdatePrep}
        application={detailApp}
      />

      <ApplicationFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onArchive={handleArchive}
        application={editingApp}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}
