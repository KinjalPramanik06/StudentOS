import React from 'react';
import { motion } from 'motion/react';

export interface SemesterPhase {
  id: number;
  name: string;
  shortName: string;
  rangeLabel: string;
  gradient: string;
  badgeStyle: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
}

export const SEMESTER_PHASES: SemesterPhase[] = [
  {
    id: 1,
    name: 'First quarter of semester',
    shortName: 'First quarter',
    rangeLabel: '0 - 25%',
    gradient: 'from-emerald-500 to-teal-500',
    badgeStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 2,
    name: 'Second quarter of semester',
    shortName: 'Second quarter',
    rangeLabel: '25 - 50%',
    gradient: 'from-blue-500 to-cyan-500',
    badgeStyle: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500',
    dotColor: 'bg-blue-500',
  },
  {
    id: 3,
    name: 'Third quarter of semester',
    shortName: 'Third quarter',
    rangeLabel: '50 - 75%',
    gradient: 'from-indigo-500 to-purple-500',
    badgeStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-500',
    dotColor: 'bg-indigo-500',
  },
  {
    id: 4,
    name: 'Fourth quarter of semester',
    shortName: 'Fourth quarter',
    rangeLabel: '75 - 100%',
    gradient: 'from-purple-500 to-rose-500',
    badgeStyle: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    textColor: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-500',
    dotColor: 'bg-rose-500',
  },
];

interface SemesterProgressBarProps {
  percentage: number;
  compact?: boolean;
  showLabels?: boolean;
  showPhaseBadges?: boolean;
  activityLabel?: string;
  isBreak?: boolean;
  heightClass?: string;
  className?: string;
}

export const SemesterProgressBar: React.FC<SemesterProgressBarProps> = ({
  percentage,
  compact = false,
  showLabels = false,
  showPhaseBadges = false,
  activityLabel = 'No calendar events today',
  isBreak = false,
  heightClass,
  className = '',
}) => {
  const safePct = Math.min(100, Math.max(0, percentage));

  // Determine current active phase
  const activePhaseIndex = Math.min(3, Math.floor(safePct / 25));
  const activePhase = SEMESTER_PHASES[activePhaseIndex];

  const defaultHeight = heightClass || (compact ? 'h-2' : 'h-3');

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {/* Top Phase Header / Badge */}
      {showPhaseBadges && (
        <div className="flex items-center justify-between text-[10px] font-mono font-bold">
          {isBreak ? (
            <>
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Semester Break (Holiday Period)</span>
              </span>
              <span className="px-1.5 py-0.5 rounded-md border text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                Holiday
              </span>
            </>
          ) : (
            <>
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${activePhase.dotColor} animate-pulse`} />
                <span data-calendar-activity className="min-w-0 break-words">Today: {activityLabel}</span>
              </span>
              <span className={`px-1.5 py-0.5 rounded-md border text-[9px] ${activePhase.badgeStyle}`}>
                {safePct}% Completed
              </span>
            </>
          )}
        </div>
      )}

      {/* 4 Color-Coded Segments Grid */}
      <div className={`grid grid-cols-4 gap-1.5 w-full bg-slate-200/60 dark:bg-slate-800/60 p-0.5 rounded-xl border border-slate-300/40 dark:border-slate-700/50`}>
        {SEMESTER_PHASES.map((phase, idx) => {
          const segStart = idx * 25;
          const segFill = Math.max(0, Math.min(100, ((safePct - segStart) / 25) * 100));
          const isCurrentSegment = safePct >= segStart && safePct < segStart + 25;
          const isFullyCompleted = segFill === 100;

          return (
            <div
              key={phase.id}
              className={`relative ${defaultHeight} bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden transition group`}
              title={isBreak ? `Semester Break Holiday Period` : `${phase.name} (${phase.rangeLabel}): ${Math.round(segFill)}% completed`}
            >
              {/* Animated Segment Progress Fill */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${segFill}%` }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                className={`h-full bg-gradient-to-r ${isBreak ? 'from-amber-500 to-orange-500' : phase.gradient} rounded-lg shadow-xs relative`}
              >
                {/* Glowing Leading Pulse Line for current active segment */}
                {isCurrentSegment && segFill > 0 && segFill < 100 && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/90 dark:bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
                )}
              </motion.div>

              {/* Segment Tick Indicator / Label on Hover */}
              {isFullyCompleted && (
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition" />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Segment Labels */}
      {showLabels && (
        <div className="grid grid-cols-4 gap-1 text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500 text-center">
          <span className={safePct >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>Q1 (0-25%)</span>
          <span className={safePct >= 25 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>Q2 (25-50%)</span>
          <span className={safePct >= 50 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}>Q3 (50-75%)</span>
          <span className={safePct >= 75 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>Q4 (75-100%)</span>
        </div>
      )}
    </div>
  );
};
