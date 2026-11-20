import React from 'react';
import { Palmtree, Calendar, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const HolidayPage: React.FC = () => {
  const { holidays } = useAppStore();

  const upcoming = holidays[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-blue-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Palmtree className="w-4 h-4 text-emerald-300" /> Official Institute Schedule
          </div>
          <h1 className="text-2xl font-black tracking-tight">Holiday & Festive Calendar</h1>
          <p className="text-xs text-emerald-100 mt-1">
            National, festival, and vacation dates you add to your calendar
          </p>
        </div>

        {upcoming && (
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-left min-w-[220px]">
            <div className="text-[10px] font-bold uppercase text-emerald-200 tracking-wider">Next Holiday</div>
            <div className="text-lg font-black text-white mt-0.5">{upcoming.title}</div>
            <div className="text-xs text-emerald-100 font-mono mt-1">
              📅 {upcoming.date} {upcoming.endDate ? `to ${upcoming.endDate}` : ''}
            </div>
          </div>
        )}
      </div>

      {/* Holiday Cards List Grid */}
      {holidays.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {holidays.map((hol) => (
            <div
              key={hol.id}
              className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border transition-all ${
                hol.isImportant
                  ? 'border-emerald-300 dark:border-emerald-800 shadow-md ring-1 ring-emerald-500/30'
                  : 'border-slate-200/80 dark:border-slate-800 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  {hol.category}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  {hol.date}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-900 dark:text-white text-base mt-3">
                {hol.title}
              </h3>

              {hol.endDate && (
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  Duration: {hol.date} to {hol.endDate}
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {hol.description}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Palmtree className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No Holidays Listed
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              No official holidays are currently listed. Holidays can be added or uploaded as needed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
