import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Briefcase, KanbanSquare, CalendarDays, FileText, ArrowRight } from 'lucide-react';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15">
            <Briefcase className="w-5 h-5 text-primary" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">AceJob</span>
        </div>
        {isAuthenticated ? (
          <Link
            to="/dashboard"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-foreground border border-border px-4 py-2 rounded-lg hover:bg-accent transition-colors">
              Log in
            </Link>
            <Link to="/register" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
              Get started
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 mb-6">
            <Briefcase className="w-8 h-8 text-primary" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Hunt with clarity.<br />Land the offer.
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Track every application, interview, and follow-up in one organized board.
            Never lose momentum in your job search.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg text-base font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Open my board <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg text-base font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  Get started free <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 rounded-lg text-base font-semibold border border-border hover:bg-accent transition-colors"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-3xl w-full">
          {[
            { icon: KanbanSquare, title: 'Kanban Board', desc: 'Drag applications across stages' },
            { icon: CalendarDays, title: 'Interview Tracker', desc: 'Never miss an interview' },
            { icon: FileText, title: 'Resume Library', desc: 'Keep your resumes organized' },
          ].map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-5 text-left">
              <f.icon className="w-5 h-5 text-primary mb-3" strokeWidth={2} />
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-muted-foreground/70 border-t border-border">
        AceJob — Stay organized. Land the offer.
      </footer>
    </div>
  );
}
