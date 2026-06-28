import { Outlet, NavLink } from 'react-router-dom';
import { CalendarDays, KanbanSquare, Archive, FileText, LogOut, Table2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import ThemeToggle from './ThemeToggle';
import AceJobLogo from './AceJobLogo';

export default function AppLayout() {
  const { logout } = useAuth();
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar shrink-0">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background text-foreground">
            <AceJobLogo className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-foreground leading-none">AceJob</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Hunt with clarity</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            <KanbanSquare className="w-4.5 h-4.5" strokeWidth={2} />
            Board
          </NavLink>
          <NavLink
            to="/applications"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            <Table2 className="w-4.5 h-4.5" strokeWidth={2} />
            Applications
          </NavLink>
          <NavLink
            to="/interviews"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            <CalendarDays className="w-4.5 h-4.5" strokeWidth={2} />
            Interviews
          </NavLink>
          <NavLink
            to="/resume-library"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            <FileText className="w-4.5 h-4.5" strokeWidth={2} />
            Resume Library
          </NavLink>
          <NavLink
            to="/archived"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            <Archive className="w-4.5 h-4.5" strokeWidth={2} />
            Archived
          </NavLink>
        </nav>

        <div className="px-3 pb-2">
          <ThemeToggle />
        </div>

        <div className="px-3 py-3 border-t border-border">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 border-b border-border bg-sidebar">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-background text-foreground">
            <AceJobLogo className="w-5 h-5" />
          </div>
          <h1 className="text-sm font-bold tracking-tight">AceJob</h1>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink to="/dashboard" end className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive ? 'bg-primary/12 text-primary' : 'text-muted-foreground'}`}>
            <KanbanSquare className="w-3.5 h-3.5" /> Board
          </NavLink>
          <NavLink to="/applications" className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive ? 'bg-primary/12 text-primary' : 'text-muted-foreground'}`}>
            <Table2 className="w-3.5 h-3.5" /> Apps
          </NavLink>
          <NavLink to="/interviews" className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive ? 'bg-primary/12 text-primary' : 'text-muted-foreground'}`}>
            <CalendarDays className="w-3.5 h-3.5" /> Interviews
          </NavLink>
          <NavLink to="/resume-library" className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive ? 'bg-primary/12 text-primary' : 'text-muted-foreground'}`}>
            <FileText className="w-3.5 h-3.5" /> Resumes
          </NavLink>
          <NavLink to="/archived" className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive ? 'bg-primary/12 text-primary' : 'text-muted-foreground'}`}>
            <Archive className="w-3.5 h-3.5" /> Archived
          </NavLink>
          <ThemeToggle compact />
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto scrollbar-thin pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
