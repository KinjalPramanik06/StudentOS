import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isNight = resolvedTheme === 'dark';
  const label = isNight ? 'Day mode' : 'Night mode';
  const Icon = isNight ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${label.toLowerCase()}`}
      title={`Switch to ${label.toLowerCase()}`}
      data-theme-toggle
      data-current-theme={resolvedTheme}
      className="inline-flex min-h-11 w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition-colors hover:bg-slate-100 active:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700 dark:active:bg-slate-600 sm:w-28 sm:px-3"
    >
      <Icon aria-hidden="true" className={`h-4 w-4 ${isNight ? 'text-amber-300' : 'text-indigo-600'}`} />
      <span className="hidden whitespace-nowrap text-xs font-semibold sm:inline">{label}</span>
    </button>
  );
};
