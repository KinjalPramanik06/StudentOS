import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Sparkles } from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface DashboardLoaderProps {
  onComplete: () => void;
  userName?: string;
}

export const DashboardLoader: React.FC<DashboardLoaderProps> = ({ onComplete, userName }) => {
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      try {
        soundManager.playWelcome();
      } catch (e) {
        // Ignore audio playback exceptions
      }
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    };

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(finish, 50);
          return 100;
        }
        return prev + Math.floor(Math.random() * 25) + 30;
      });
    }, 40);

    // Hard safety timer (max 750ms) to guarantee loader completes even if browser throttles timers
    const safetyTimer = setTimeout(finish, 750);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.02, filter: 'blur(6px)' }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl p-6"
      >
        {/* Soft Background Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-indigo-600/20 rounded-full blur-3xl"
          />
        </div>

        {/* Glass Loading Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative max-w-sm w-full p-8 rounded-3xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/20 dark:border-slate-800 shadow-2xl flex flex-col items-center text-center text-white"
        >
          {/* Animated Logo Icon */}
          <div className="relative mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-3 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 opacity-60 blur-md"
            />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
          </div>

          <h3 className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
            StudentOS <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {userName ? `Welcome back, ${userName}` : 'Initializing your workspace...'}
          </p>

          {/* Progress Indicator */}
          <div className="w-full mt-6 space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Readying workspace</span>
              <span>{Math.min(100, progress)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400"
                style={{ width: `${Math.min(100, progress)}%` }}
                transition={{ duration: 0.08, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
