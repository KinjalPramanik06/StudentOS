import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

// Refresh shared publications without interrupting a form or changing the viewed semester.
export function useDataSync() {
  const uid = useAppStore((state) => state.user?.uid);
  useEffect(() => {
    if (!uid) return;
    let pending = false;
    const refresh = async () => {
      if (pending || document.hidden || document.querySelector('[role="dialog"]')) return;
      pending = true;
      try { await useAppStore.getState().fetchData(true); }
      finally { pending = false; }
    };
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [uid]);
}
