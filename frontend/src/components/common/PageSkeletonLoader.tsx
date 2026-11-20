import React from 'react';
import { motion } from 'motion/react';

export const PageSkeletonLoader: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="w-full space-y-6 animate-pulse"
    >
      {/* Skeleton Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-80 rounded-md bg-slate-200/70 dark:bg-slate-800/70" />
          </div>
        </div>
      </div>

      {/* Skeleton 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-8 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-2 w-full rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
          </div>
        ))}
      </div>

      {/* Skeleton Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4 h-72">
          <div className="h-5 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-48 w-full rounded-2xl bg-slate-200/50 dark:bg-slate-800/50" />
        </div>
        <div className="p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4 h-72">
          <div className="h-5 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-12 w-full rounded-xl bg-slate-200/50 dark:bg-slate-800/50" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
