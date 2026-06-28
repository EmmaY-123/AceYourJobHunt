import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const DISMISS_KEY = 'acejob_extension_banner_dismissed';
const INSTALL_URL = 'https://github.com/EmmaY-123/AceYourJobHunt/tree/main/browser-extension';

export default function ExtensionInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === 'true') return;

    const sync = () => {
      setVisible(document.documentElement.dataset.acejobExtension !== 'installed');
    };

    sync();
    window.addEventListener('acejob-extension-detected', sync);
    return () => window.removeEventListener('acejob-extension-detected', sync);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mx-6 mt-4 rounded-lg border border-amber-300/40 bg-amber-100/70 px-4 py-3 text-amber-950 shadow-sm dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            Wanna save jobs directly from any job site?
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={INSTALL_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Add Chrome Extension
          </a>
          <button
            type="button"
            onClick={dismiss}
            className="text-sm font-medium text-amber-800/80 hover:text-amber-950 dark:text-amber-100/75 dark:hover:text-amber-50"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close extension install banner"
            className="rounded-md p-1 text-amber-800/70 hover:bg-amber-200/70 hover:text-amber-950 dark:text-amber-100/70 dark:hover:bg-amber-300/10 dark:hover:text-amber-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
