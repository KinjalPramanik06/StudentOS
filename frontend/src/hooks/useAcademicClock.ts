import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

// One clock for the app: refresh at local midnight and after background/sleep.
export function useAcademicClock() {
  const refreshDate = useAppStore((state) => state.refreshDate);
  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      refreshDate();
      clearTimeout(midnightTimer);
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      midnightTimer = setTimeout(refresh, midnight.getTime() - now.getTime() + 50);
    };
    refresh();
    const timer = setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearTimeout(midnightTimer);
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [refreshDate]);
}
