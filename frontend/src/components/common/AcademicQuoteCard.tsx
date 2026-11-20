import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { ACADEMIC_QUOTES } from '../../data/mockData';

export const AcademicQuoteCard: React.FC = () => {
  const [index, setIndex] = useState(0);

  const current = ACADEMIC_QUOTES[index % ACADEMIC_QUOTES.length];

  const handleNext = () => {
    setIndex((prev) => prev + 1);
  };

  return (
    <div data-academic-quote className="relative p-5 rounded-2xl border border-indigo-200/70 dark:border-indigo-800/50 bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-indigo-900 dark:via-slate-900 dark:to-blue-900 text-slate-900 dark:text-white shadow-sm dark:shadow-xl overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Motivational Academic Quote
        </div>
        <button
          onClick={handleNext}
          className="p-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white/80 transition focus-visible:outline-2 focus-visible:outline-blue-500"
          aria-label="Next quote"
          title="Next Quote"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="mt-3 relative z-10">
        <blockquote className="text-sm font-medium italic text-slate-800 dark:text-slate-100 leading-relaxed">
          "{current.quote}"
        </blockquote>
        <p className="mt-2 text-xs text-indigo-700 dark:text-indigo-300 font-semibold text-right">— {current.author}</p>
      </div>
    </div>
  );
};
