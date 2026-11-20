import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Clock,
  Grid,
  CheckCircle2,
  Award,
  Calendar,
  BookOpen,
  FolderDown,
  BarChart2,
  User,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Palmtree,
  GraduationCap,
  Globe,
  Layers,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useSchedule } from '../../hooks/useSchedule';
import { useSound } from '../../hooks/useSound';
import { ProfileAvatar } from '../common/ProfileAvatar';
import { SemesterProgressBar } from '../common/SemesterProgressBar';
import { useCalendarActivity } from '../../hooks/useCalendarActivity';
import { DEFAULT_ACADEMIC_CALENDAR } from '../../data/defaultAcademicCalendar';
import { attendanceSemester, getSubjectAttendance } from '../../utils/attendanceThreshold';

interface SemesterConfig {
  id: number;
  name: string;
  fullName: string;
  year: string;
  isCurrent?: boolean;
}

const SEMESTERS: SemesterConfig[] = [
  { id: 1, name: 'Sem 1', fullName: 'Semester 1', year: '1st Year • Autumn' },
  { id: 2, name: 'Sem 2', fullName: 'Semester 2', year: '1st Year • Spring', isCurrent: true },
  { id: 3, name: 'Sem 3', fullName: 'Semester 3', year: '2nd Year • Autumn' },
  { id: 4, name: 'Sem 4', fullName: 'Semester 4', year: '2nd Year • Spring' },
  { id: 5, name: 'Sem 5', fullName: 'Semester 5', year: '3rd Year • Autumn' },
  { id: 6, name: 'Sem 6', fullName: 'Semester 6', year: '3rd Year • Spring' },
  { id: 7, name: 'Sem 7', fullName: 'Semester 7', year: '4th Year • Autumn' },
  { id: 8, name: 'Sem 8', fullName: 'Semester 8', year: '4th Year • Spring' },
];

export const Sidebar: React.FC = () => {
  const { activeSemester, setActiveSemester } = useSchedule();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSemesters, setOpenSemesters] = useState<number[]>([activeSemester || 2]);
  const { user, logout, academicCalendar, semesterInfo, attendance } = useAppStore();
  const activityLabel = useCalendarActivity();
  const { playClick, playTab, playWarning } = useSound();
  const navigate = useNavigate();
  const location = useLocation();

  const semesterList = React.useMemo(() => {
    const calMap = new Map<number, any>();
    DEFAULT_ACADEMIC_CALENDAR.forEach((def) => {
      calMap.set(def.semesterNumber, def);
    });
    if (academicCalendar && academicCalendar.length > 0) {
      academicCalendar.forEach((s) => {
        const num = Number(s.semesterNumber || s.id);
        if (num >= 1 && num <= 8) {
          calMap.set(num, s);
        }
      });
    }

    return Array.from({ length: 8 }, (_, idx) => {
      const semNum = idx + 1;
      const defaultConf = SEMESTERS.find((s) => s.id === semNum) || SEMESTERS[idx];
      const calData = calMap.get(semNum);

      const isCurrent = semNum === (semesterInfo?.currentSemesterId || activeSemester || 2);

      return {
        id: semNum,
        name: calData?.name || defaultConf.name,
        fullName: calData?.fullName || defaultConf.fullName,
        year: calData?.session ? `${calData.session} • ${calData.department || 'CSE'}` : defaultConf.year,
        isCurrent,
      };
    });
  }, [academicCalendar, semesterInfo?.currentSemesterId, activeSemester]);

  React.useEffect(() => {
    if (activeSemester && !openSemesters.includes(activeSemester)) {
      setOpenSemesters((prev) => [...prev, activeSemester]);
    }
  }, [activeSemester]);

  const toggleSemester = (semId: number) => {
    playClick();
    setActiveSemester(semId);
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    setOpenSemesters((prev) =>
      prev.includes(semId) ? prev.filter((id) => id !== semId) : [...prev, semId]
    );
  };

  const getModulesForSem = (semId: number) => {
    const isCurrentSem = semId === (semesterInfo?.currentSemesterId || activeSemester || 2);
    const semesterAttendance = attendance.filter((record) =>
      record.studentId === user?.uid && attendanceSemester(record) === semId
    );
    const lowCount = semesterAttendance.filter((record) => getSubjectAttendance(record).belowMinimum).length;
    const held = semesterAttendance.reduce((sum, record) => sum + getSubjectAttendance(record).held, 0);
    const present = semesterAttendance.reduce((sum, record) => sum + getSubjectAttendance(record).present, 0);
    const attendanceBadge = isCurrentSem && user?.role === 'student' && held > 0
      ? lowCount > 0 ? `${lowCount} alert${lowCount === 1 ? '' : 's'}` : `${Math.round((present / held) * 100)}%`
      : undefined;

    const baseModules = [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { label: "Today's Schedule", icon: Clock, path: '/schedule' },
      { label: 'Timetable', icon: Grid, path: '/timetable' },
      { label: 'Attendance', icon: CheckCircle2, path: '/attendance', badge: attendanceBadge },
      { label: 'Marks Ledger', icon: Award, path: '/marks' },
      { label: 'YGPA & SGPA Tracker', icon: GraduationCap, path: '/ygpa-sgpa' },
      { label: 'Academic Calendar', icon: Calendar, path: '/calendar' },
      { label: 'Holiday Calendar', icon: Palmtree, path: '/holidays' },
      { label: 'Subjects', icon: BookOpen, path: '/subjects' },
      { label: 'Analytics', icon: BarChart2, path: '/analytics' },
      { label: 'Profile', icon: User, path: '/profile' },
      { label: 'Settings', icon: Settings, path: '/settings' },
    ];

    if (user?.role === 'admin') {
      baseModules.push({ label: 'Admin Portal', icon: ShieldCheck, path: '/admin', badge: 'Admin' });
    }

    return baseModules;
  };

  const handleLogout = () => {
    playWarning();
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`hidden md:flex sticky top-0 left-0 z-40 h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-r border-slate-200/60 dark:border-slate-800/80 transition-all duration-300 flex-col justify-between shrink-0 shadow-sm ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className="flex flex-col h-full justify-between overflow-hidden">
        <div className="flex flex-col h-full min-h-0">
          {/* Logo / Brand Header */}
          <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between shrink-0">
            <div
              onClick={() => {
                playClick();
                navigate('/dashboard');
              }}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition group"
              title="Go to Active Dashboard"
            >
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
                <Layers className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <div>
                  <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-['Poppins','Inter',sans-serif] block leading-none">
                    StudentOS
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase">
                    Academic Suite
                  </span>
                </div>
              )}
            </div>

            {/* Collapse Toggle Button (Desktop) */}
            <button
              onClick={() => {
                playClick();
                setIsCollapsed(!isCollapsed);
              }}
              className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-400 hover:text-slate-700 dark:hover:text-white transition shadow-sm"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Scrollable Semester Accordion Navigation */}
          <nav className="p-3 space-y-1.5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Semester Curriculum</span>
                <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-mono font-semibold">
                  Sem 1 - 8
                </span>
              </div>
            )}

            {semesterList.map((sem) => {
              const isOpen = openSemesters.includes(sem.id);
              const modules = getModulesForSem(sem.id);
              const hasActiveRoute = modules.some((m) => location.pathname === m.path);

              if (isCollapsed) {
                return (
                  <div key={sem.id} className="relative group">
                    <button
                      onClick={() => toggleSemester(sem.id)}
                      className={`w-full flex flex-col items-center justify-center p-2 rounded-xl transition ${
                        hasActiveRoute || sem.isCurrent
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                      }`}
                      title={sem.fullName}
                    >
                      <span className="text-[11px] font-black font-mono tracking-tighter uppercase">
                        {sem.name}
                      </span>
                      {sem.isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5" />
                      )}
                    </button>
                  </div>
                );
              }

              return (
                <div key={sem.id} className="rounded-2xl overflow-hidden border border-transparent">
                  {/* Semester Header Node */}
                  <button
                    onClick={() => toggleSemester(sem.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-2xl text-left transition ${
                      isOpen
                        ? 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-white font-semibold shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold font-mono transition ${
                          sem.isCurrent
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20'
                            : isOpen
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        S{sem.id}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <span className="truncate">{sem.fullName}</span>
                          {sem.id === activeSemester && (
                            <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-blue-600 text-white rounded-md">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate font-medium">{sem.year}</div>
                      </div>
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                      }`}
                    />
                  </button>

                  {/* Expandable Module Sub-list */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key={`sem-accordion-${sem.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden pl-3 ml-4 border-l-2 border-slate-200/80 dark:border-slate-800/80 my-1 space-y-0.5"
                      >
                        {modules.map((item) => {
                          const Icon = item.icon;
                          return (
                            <NavLink
                              key={`${sem.id}-${item.path}-${item.label}`}
                              to={item.path}
                              onClick={() => {
                                playTab();
                                setActiveSemester(sem.id);
                              }}
                              className={({ isActive }) =>
                                `flex items-center justify-between px-2.5 py-2 min-h-[38px] rounded-xl text-xs font-medium transition ${
                                  isActive
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                                }`
                              }
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.badge && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                  {item.badge}
                                </span>
                              )}
                            </NavLink>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer Card & User Profile */}
        <div className="p-3 space-y-2 border-t border-slate-200/60 dark:border-slate-800/60 shrink-0">
          {!isCollapsed && (
            <div className="relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-3 border border-blue-500/20 dark:border-blue-500/30 shadow-md shadow-blue-500/5 group hover:border-blue-500/40 transition-all">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Current Semester
                </p>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                    semesterInfo.status === 'Semester Active'
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  {semesterInfo.status}
                </span>
              </div>
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                {semesterInfo.semesterName} ({semesterInfo.department ? 'CSE Dept' : 'Main'})
              </p>
              <div className="mt-2 space-y-1">
                <SemesterProgressBar
                  percentage={semesterInfo.progressPercentage}
                  compact
                  showPhaseBadges
                  activityLabel={activityLabel}
                  isBreak={semesterInfo.status === 'Semester Break'}
                />
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between text-[9px] text-slate-400">
                <span>{semesterInfo.daysCompleted} days completed</span>
                <span>{semesterInfo.daysRemaining} days left</span>
              </div>
            </div>
          )}

          {/* Profile Bar */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/80">
              <div className="flex items-center gap-2 min-w-0">
                <ProfileAvatar src={user?.photoURL} userId={user?.uid} alt={user?.name} className="w-8 h-8 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-800 dark:text-white truncate">
                    {user?.name}
                  </div>
                  <div
                    className="text-[10px] text-slate-400 truncate"
                    title={user?.role === 'admin' ? 'Faculty Admin' : `${user?.department || 'Student'} • ${semesterInfo.semesterName} • ${semesterInfo.academicSession}`}
                  >
                    {user?.role === 'admin'
                      ? 'Faculty Admin'
                      : `${user?.department?.includes('Computer Science') ? 'CSE' : user?.department || 'Student'} • ${semesterInfo.semesterName}`}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 min-h-[36px] min-w-[36px] text-slate-400 hover:text-rose-500 transition rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2.5 min-h-[44px] rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition items-center"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
