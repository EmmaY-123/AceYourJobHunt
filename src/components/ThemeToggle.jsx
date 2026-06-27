import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const Switch = (
    <button
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
        isDark ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform duration-200 ${
          isDark ? 'translate-x-[22px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  );

  if (compact) {
    return Switch;
  }

  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
      <span className="flex items-center gap-2.5">
        {isDark ? <Moon className="w-4.5 h-4.5" strokeWidth={2} /> : <Sun className="w-4.5 h-4.5" strokeWidth={2} />}
        {isDark ? 'Dark mode' : 'Light mode'}
      </span>
      {Switch}
    </div>
  );
}
