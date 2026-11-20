import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast, ToastItem } from '../../context/ToastContext';
import { soundManager } from '../../utils/soundEffects';

const ToastSingle: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    // Play audio effect based on type
    if (toast.type === 'success') soundManager.playSuccess();
    else if (toast.type === 'error' || toast.type === 'warning') soundManager.playWarning();
    else soundManager.playBell();

    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-cyan-500 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/30 dark:border-emerald-500/40';
      case 'error':
        return 'border-rose-500/30 dark:border-rose-500/40';
      case 'warning':
        return 'border-amber-500/30 dark:border-amber-500/40';
      case 'info':
      default:
        return 'border-cyan-500/30 dark:border-cyan-500/40';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.85, filter: 'blur(6px)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`relative overflow-hidden w-full max-w-sm rounded-2xl p-4 shadow-xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/85 border ${getBorderColor()} text-slate-900 dark:text-slate-100 flex items-start gap-3.5 z-50`}
    >
      <div className="pt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm leading-snug">{toast.title}</h4>
        {toast.message && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => {
          soundManager.playClick();
          onDismiss(toast.id);
        }}
        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar Animation */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-1 ${
          toast.type === 'success'
            ? 'bg-emerald-500'
            : toast.type === 'error'
            ? 'bg-rose-500'
            : toast.type === 'warning'
            ? 'bg-amber-500'
            : 'bg-cyan-500'
        }`}
      />
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm ml-auto">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full">
            <ToastSingle toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
