import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
  footer,
}) => {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const onCloseRef = React.useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Play pop sound effect only once when modal transitions to open
  useEffect(() => {
    if (isOpen) {
      soundManager.playPop();
    }
  }, [isOpen]);

  // ESC Key listener
  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusFrame = requestAnimationFrame(() => dialogRef.current?.focus({ preventScroll: true }));
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundManager.playWhoosh();
        onCloseRef.current();
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const controls = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')].filter((element) => element.getClientRects().length);
        const first = controls[0], last = controls[controls.length - 1];
        if (!first) { e.preventDefault(); return; }
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { e.preventDefault(); first.focus(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case '3xl':
        return 'max-w-3xl';
      case '4xl':
        return 'max-w-4xl';
      default:
        return 'max-w-lg';
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div data-glass-modal className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              soundManager.playWhoosh();
              onClose();
            }}
            className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Dialog'}
            className={`relative flex flex-col max-h-[90dvh] w-full ${getMaxWidthClass()} rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden my-auto`}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
                {title ? (
                  <div className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    {title}
                  </div>
                ) : (
                  <div />
                )}
                {showCloseButton && (
                  <button
                    onClick={() => {
                      soundManager.playWhoosh();
                      onClose();
                    }}
                    aria-label="Close dialog"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content Body */}
            <div data-dialog-body className="p-6 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar">{children}</div>
            {footer && <div data-dialog-footer className="shrink-0 px-6 py-3 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/95">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>, document.body
  );
};
