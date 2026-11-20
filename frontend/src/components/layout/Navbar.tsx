import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  User,
  ShieldAlert,
  ChevronDown,
  LogOut,
  Settings,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  KeyRound,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { ProfileAvatar } from '../common/ProfileAvatar';
import { ThemeToggle } from '../common/ThemeToggle';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';

export const Navbar: React.FC = () => {
  const { user, toggleSearch, loginWithEmail, logout, allStudents, currentDate } = useAppStore();
  const { soundOn, toggleSound, playClick, playPop, playWhoosh, playWarning } = useSound();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Password Verification Modal state for Quick Profile Switcher
  const [switcherTarget, setSwitcherTarget] = useState<{ name: string; email: string; role: 'student' | 'admin' } | null>(null);
  const [switcherPassword, setSwitcherPassword] = useState('');
  const [showSwitcherPassword, setShowSwitcherPassword] = useState(false);
  const [switcherError, setSwitcherError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const handleSwitcherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!switcherTarget) return;
    setSwitcherError('');
    try {
      await loginWithEmail(switcherTarget.email, switcherPassword, switcherTarget.role);
      sessionStorage.setItem('studentos_just_logged_in', 'true');
      playClick();
      setSwitcherTarget(null);
      setSwitcherPassword('');
      setShowRoleMenu(false);
      navigate('/dashboard');
    } catch (err: any) {
      playWarning();
      setSwitcherError(err.message || 'Incorrect password.');
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Academic Dashboard';
    if (path.includes('schedule')) return "Today's Schedule";
    if (path.includes('timetable')) return 'Weekly Timetable';
    if (path.includes('attendance')) return 'Attendance Tracker';
    if (path.includes('marks')) return 'Marks Ledger';
    if (path.includes('ygpa-sgpa')) return 'YGPA & SGPA Analytics';
    if (path.includes('calendar')) return 'Academic Calendar';
    if (path.includes('holidays')) return 'Holidays & Vacations';
    if (path.includes('subjects')) return 'Subjects & Curriculum';
    if (path.includes('analytics')) return 'Performance Analytics';
    if (path.includes('profile')) return 'Student Profile';
    if (path.includes('admin')) return 'Faculty Admin Panel';
    if (path.includes('settings')) return 'System Settings';
    return 'Academic Dashboard';
  };

  return (
    <>
    <header data-app-header className="studentos-header absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 2xl:px-10 transition-colors">
      {/* Left Title */}
      <div className="flex min-w-0 items-center gap-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Poppins','Inter',sans-serif] truncate tracking-tight">
          <span className="hidden md:inline">{getPageTitle()}</span>
          <span className="md:hidden">{getPageTitle().replace('Academic Dashboard', 'Dashboard').replace('Attendance Tracker', 'Attendance').replace('Weekly Timetable', 'Timetable').replace('Academic Calendar', 'Calendar').replace('Subjects & Curriculum', 'Subjects').replace('YGPA & SGPA Analytics', 'Results').replace('Student Profile', 'Profile').replace('System Settings', 'Settings').replace('Faculty Admin Panel', 'Admin').replace('Holidays & Vacations', 'Holidays').replace('Performance Analytics', 'Analytics')}</span>
        </h2>
      </div>

      {/* Center Search Trigger */}
      <div className="flex-1 min-w-0 max-w-xs lg:max-w-sm xl:max-w-md 2xl:max-w-lg mx-2 lg:mx-4 hidden md:block">
        <button
          onClick={() => {
            playClick();
            toggleSearch(true);
          }}
          className="w-full min-h-[38px] flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition text-xs shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search courses, faculty...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-slate-500 dark:text-slate-300 shadow-sm">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <button onClick={() => { playClick(); toggleSearch(true); }} aria-label="Search StudentOS" className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80">
          <Search className="w-4 h-4" />
        </button>
        <ThemeToggle />
        {/* Date Display */}
        <div className="text-right hidden sm:block">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Today</p>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {dayjs(currentDate).format('dddd, MMM D YYYY')}
          </p>
        </div>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => {
              if (showRoleMenu) playWhoosh();
              else playPop();
              setShowRoleMenu(!showRoleMenu);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
            title="Switch account"
          >
            {user?.role === 'admin' ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Admin Mode</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">Student</span>
              </>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <AnimatePresence>
            {showRoleMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-60 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-2 z-50 text-xs"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Quick Profile Switcher</span>
                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-semibold">
                    {allStudents.length} Students
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 my-1 pr-1 custom-scrollbar">
                  {allStudents.map((std) => {
                    const isCurrent = user?.email?.toLowerCase() === std.email.toLowerCase() && user?.role === 'student';
                    return (
                      <button
                        key={std.uid}
                        onClick={() => {
                          playPop();
                          setSwitcherTarget({ name: std.name, email: std.email, role: 'student' });
                          setSwitcherPassword('');
                          setSwitcherError('');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 min-h-[40px] rounded-xl text-left transition ${
                          isCurrent
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold truncate">{std.name}</div>
                          <div className="text-[10px] opacity-75 truncate">{std.email}</div>
                        </div>
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="my-1 border-t border-slate-200/60 dark:border-slate-800" />
                <button
                  onClick={() => {
                    playPop();
                    void logout().then(() => navigate('/login'));
                    setSwitcherPassword('');
                    setSwitcherError('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 min-h-[40px] rounded-xl text-left transition ${
                    user?.role === 'admin'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold'
                      : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-bold">Sign in to another account</div>
                    <div className="text-[10px] opacity-75">Use your account email and password</div>
                  </div>
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Audio Sound Effects Toggle Button */}
        <button
          onClick={toggleSound}
          className="hidden sm:flex p-2 min-h-[38px] min-w-[38px] rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition items-center justify-center"
          title={soundOn ? 'Sound Effects Enabled' : 'Sound Effects Disabled'}
        >
          {soundOn ? (
            <Volume2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* User Avatar Circle */}
        <div className="relative">
          <button
            onClick={() => {
              if (showProfileMenu) playWhoosh();
              else playPop();
              setShowProfileMenu(!showProfileMenu);
            }}
            className="w-9 h-9 rounded-full bg-blue-100 border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center overflow-hidden hover:opacity-90 active:scale-95 transition"
          >
            <ProfileAvatar src={user?.photoURL} userId={user?.uid} alt={user?.name} className="w-full h-full" />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-60 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-3 z-50 text-xs"
              >
                <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{user?.email}</p>
                  <div className="mt-1 text-[10px] text-slate-400 font-mono">
                    <span>Roll: {user?.rollNumber}</span>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <button
                    onClick={() => {
                      playClick();
                      setShowProfileMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 min-h-[40px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition font-medium"
                  >
                    <User className="w-4 h-4 text-blue-500" /> Profile Details
                  </button>
                  <button
                    onClick={() => {
                      playClick();
                      setShowProfileMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 min-h-[40px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition font-medium"
                  >
                    <Settings className="w-4 h-4 text-emerald-500" /> Preferences
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    onClick={() => {
                      playWarning();
                      setShowProfileMenu(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 min-h-[40px] rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 font-semibold transition"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </header>

      {switcherTarget && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative text-left"
          >
            <button
              onClick={() => {
                playWhoosh();
                setSwitcherTarget(null);
              }}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white font-['Poppins','Inter',sans-serif]">
                  Password Required
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Switch profile to <span className="font-bold text-indigo-600 dark:text-indigo-400">{switcherTarget.name}</span>
                </p>
              </div>
            </div>

            {switcherError && (
              <div className="mb-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{switcherError}</span>
              </div>
            )}

            <form onSubmit={handleSwitcherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password for {switcherTarget.email}
                </label>
                <div className="relative">
                  <input
                    type={showSwitcherPassword ? 'text' : 'password'}
                    value={switcherPassword}
                    onChange={(e) => setSwitcherPassword(e.target.value)}
                    placeholder="Enter profile password..."
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSwitcherPassword(!showSwitcherPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showSwitcherPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    playWhoosh();
                    setSwitcherTarget(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Confirm & Switch
                </button>
              </div>
            </form>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
};
