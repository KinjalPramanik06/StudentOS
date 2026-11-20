import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  /**
   * NOTE: matches how this is called throughout the app: addToast(message, type).
   * This is intentionally the same as `showToast` below — see comment in the provider.
   */
  addToast: (message: string, type?: ToastType, extraMessage?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  showToast: (messageOrTitle: string, type?: ToastType, extraMessage?: string, duration?: number) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToastRaw = useCallback(
    (type: ToastType, title: string, message?: string, duration: number = 4000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };
      setToasts((prev) => [newToast, ...prev].slice(0, 5));
    },
    []
  );

  const showToast = useCallback(
    (messageOrTitle: string, type: ToastType = 'info', extraMessage?: string, duration?: number) => {
      if (extraMessage) {
        addToastRaw(type, messageOrTitle, extraMessage, duration);
      } else {
        addToastRaw(type, messageOrTitle, undefined, duration);
      }
    },
    [addToastRaw]
  );

  // Every call site in this app uses `addToast(message, type)` — the same
  // order as `showToast` — so `addToast` is exposed as an alias of it
  // rather than the (type, title, message) order it was originally defined with.
  const addToast = showToast;

  const showSuccess = useCallback((title: string, message?: string) => addToastRaw('success', title, message), [addToastRaw]);
  const showError = useCallback((title: string, message?: string) => addToastRaw('error', title, message), [addToastRaw]);
  const showWarning = useCallback((title: string, message?: string) => addToastRaw('warning', title, message), [addToastRaw]);
  const showInfo = useCallback((title: string, message?: string) => addToastRaw('info', title, message), [addToastRaw]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
