import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Clock,
  Calendar,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
  BookOpen,
  Award,
  FileText,
  BarChart3,
  CalendarDays,
  User,
  Settings,
  Shield,
  Search,
  Bell,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useSound } from '../../hooks/useSound';
import { ThemeToggle } from '../common/ThemeToggle';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppStore();
  const { soundOn, toggleSound, playTab, playClick, playPop, playWhoosh } = useSound();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', path: '/attendance', icon: CheckCircle2 },
    { label: 'Timetable', path: '/timetable', icon: Clock },
    { label: 'Schedule', path: '/schedule', icon: Calendar },
  ];

  const moreItems = [
    { label: 'Marks & Results', path: '/marks', icon: Award },
    { label: 'YGPA / SGPA Calculator', path: '/ygpa-sgpa', icon: Sparkles },
    { label: 'Academic Calendar', path: '/calendar', icon: CalendarDays },
    { label: 'Holidays', path: '/holidays', icon: Calendar },
    { label: 'Subjects & Syllabus', path: '/subjects', icon: BookOpen },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
    ...(user?.role === 'admin'
      ? [{ label: 'Admin Panel', path: '/admin', icon: Shield, highlight: true }]
      : []),
  ];

  const handleNav = (path: string) => {
    playTab();
    setIsMoreOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar - Only visible on sm and below */}
      <nav aria-label="Mobile navigation" className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 shadow-2xl">
        <div className="flex items-center justify-around max-w-md mx-auto relative">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNav(item.path)}
                className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-h-[48px] min-w-[56px] text-xs transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl border border-blue-500/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 z-10 transition-transform ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 scale-110'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span
                  className={`text-[10px] mt-0.5 z-10 font-medium ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More Items Button */}
          <button
            onClick={() => {
              if (isMoreOpen) {
                playWhoosh();
                setIsMoreOpen(false);
              } else {
                playPop();
                setIsMoreOpen(true);
              }
            }}
            className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-h-[48px] min-w-[56px] text-xs transition-colors ${
              isMoreOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Menu className="w-5 h-5 z-10" />
            <span className="text-[10px] mt-0.5 z-10 font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile More Drawer */}
      <AnimatePresence>
        {isMoreOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                playWhoosh();
                setIsMoreOpen(false);
              }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              role="dialog" aria-modal="true" aria-label="Quick access"
              className="mobile-more-drawer relative w-full rounded-t-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/80 p-5 shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
              {/* Drawer handle indicator */}
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-4" />

              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/60 mb-4">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Quick Access
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSound}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    {soundOn ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  </button>
                  <ThemeToggle />
                  <button
                    onClick={() => {
                      playWhoosh();
                      setIsMoreOpen(false);
                    }}
                    aria-label="Close quick access"
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Grid of Menu Cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className={`flex items-center gap-3 p-3 rounded-2xl text-left border transition-all ${
                        isActive
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400'
                          : item.highlight
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-100/70 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-800/80 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isActive
                            ? 'bg-blue-500 text-white'
                            : item.highlight
                            ? 'bg-amber-500 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold leading-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
