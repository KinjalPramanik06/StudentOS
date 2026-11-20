import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, BookOpen, FileText, Bell, Calendar, User, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, toggleSearch, subjects, assignments, notices, timetable } = useAppStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
      if (e.key === 'Escape' && isSearchOpen) {
        toggleSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, toggleSearch]);

  if (!isSearchOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredSubjects = q ? subjects.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.faculty.toLowerCase().includes(q)) : subjects.slice(0, 3);
  const filteredNotices = q ? notices.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) : notices.slice(0, 2);

  const handleSelect = (path: string) => {
    toggleSearch(false);
    setQuery('');
    navigate(path);
  };

  return (
    <AnimatePresence>
      <div data-global-search className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Search Header */}
          <div className="relative flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              type="text"
              autoFocus
              placeholder="Search subjects, assignments, notices, faculty... (Press Esc to close)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-base"
            />
            <button
              onClick={() => toggleSearch(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
            {/* Subjects */}
            {filteredSubjects.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Subjects
                </div>
                <div className="space-y-1.5">
                  {filteredSubjects.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => handleSelect(`/subjects?code=${sub.code}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition group"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-mono">
                            {sub.code}
                          </span>
                          {sub.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {sub.faculty} • Room {sub.room} • {sub.type} ({sub.credits} Credits)
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {q && filteredSubjects.length === 0 && filteredNotices.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-sm">
                No matching results found for "{query}".
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Tip: Use <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">↓</kbd> to navigate</span>
            <span>StudentOS Academic Workspace</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
