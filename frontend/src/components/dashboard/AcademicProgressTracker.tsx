import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  Award,
  ChevronRight,
  BookmarkCheck,
  Edit2,
  Save,
  ShieldCheck,
  X,
  RotateCcw,
} from 'lucide-react';
import { AcademicSemester } from '../../types';
import { calculateSemesterProgress, getSemesterInfo } from '../../utils/academicCalendarEngine';
import { useCalendarActivity } from '../../hooks/useCalendarActivity';
import { DEFAULT_ACADEMIC_CALENDAR } from '../../data/defaultAcademicCalendar';
import { useAppStore } from '../../store/useAppStore';
import { useSound } from '../../hooks/useSound';
import { useToast } from '../../context/ToastContext';
import { GlassModal } from '../common/GlassModal';
import dayjs from 'dayjs';

interface AcademicProgressTrackerProps {
  activeSemester: number;
  academicCalendar?: AcademicSemester[];
  onNavigateToCalendar?: () => void;
  onNavigateToSubjects?: () => void;
}

export const AcademicProgressTracker: React.FC<AcademicProgressTrackerProps> = ({
  activeSemester,
  academicCalendar,
  onNavigateToCalendar,
  onNavigateToSubjects,
}) => {
  const { playClick, playSuccess, playPop } = useSound();
  const { showToast } = useToast();
  const { user, saveAcademicSemester, restoreDefaultAcademicCalendar, currentDate } = useAppStore();

  const isAdmin = user?.role === 'admin';

  // Admin Timeline Edit Modal State
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [selectedSemForEdit, setSelectedSemForEdit] = useState<number>(activeSemester);

  const calendarList = useMemo(() => {
    return (academicCalendar && academicCalendar.length > 0
      ? academicCalendar
      : DEFAULT_ACADEMIC_CALENDAR
    ).filter((s) => s.isEnabled !== false);
  }, [academicCalendar]);

  // All 8 semesters (including disabled ones for admin editing)
  const full8Semesters = useMemo(() => {
    const map = new Map<number, AcademicSemester>();
    DEFAULT_ACADEMIC_CALENDAR.forEach((def) => map.set(def.semesterNumber, def));
    if (academicCalendar) {
      academicCalendar.forEach((sem) => map.set(sem.semesterNumber, sem));
    }
    return Array.from({ length: 8 }, (_, i) => {
      const num = i + 1;
      return (
        map.get(num) || {
          id: num,
          semesterNumber: num,
          name: `Semester ${num}`,
          fullName: `Semester ${num} (4-Year B.Tech CSE)`,
          session: '',
          department: 'Computer Science & Engineering',
          startDate: '',
          endDate: '',
          isEnabled: false,
        }
      );
    });
  }, [academicCalendar]);

  // Find current active semester details
  const activeSemData = useMemo(() => {
    return (
      calendarList.find((s) => Number(s.semesterNumber) === Number(activeSemester)) ||
      calendarList[Math.min(activeSemester - 1, calendarList.length - 1)] ||
      DEFAULT_ACADEMIC_CALENDAR[1]
    );
  }, [calendarList, activeSemester]);

  // Semester progress calculation
  const semProgress = useMemo(() => {
    if (!activeSemData) {
      return { daysCompleted: 0, daysRemaining: 0, totalDays: 0, progressPercentage: 0 };
    }
    return calculateSemesterProgress(activeSemData.startDate, activeSemData.endDate, dayjs(currentDate).toDate());
  }, [activeSemData, currentDate]);

  // Overall course (8-semester degree) progress calculation
  const overallCourseStats = useMemo(() => {
    const totalSemesters = 8;
    const completedSemesters = calendarList.length ? Math.max(0, activeSemester - 1) : 0;
    const activeSemFraction = (semProgress.progressPercentage || 0) / 100;
    const completedEquivalentSemesters = completedSemesters + activeSemFraction;

    const overallPct = Math.min(
      100,
      Math.max(0, Number(((completedEquivalentSemesters / totalSemesters) * 100).toFixed(1)))
    );

    // Degree Year calculation
    const currentYearNum = Math.ceil(activeSemester / 2);
    const yearNames = ['1st Year (Freshman)', '2nd Year (Sophomore)', '3rd Year (Junior)', '4th Year (Senior)'];
    const currentYearLabel = yearNames[currentYearNum - 1] || '4th Year (Senior)';

    // Overall Degree Program Timeline Dates (Sem 1 Start -> Sem 8 End)
    const sem1 = calendarList.find((s) => s.semesterNumber === 1) || DEFAULT_ACADEMIC_CALENDAR[0];
    const sem8 = calendarList.find((s) => s.semesterNumber === 8) || DEFAULT_ACADEMIC_CALENDAR[7];
    const programStartDate = sem1 ? sem1.startDate : '';
    const programEndDate = sem8 ? sem8.endDate : '';

    return {
      overallPct,
      completedSemesters,
      totalSemesters,
      currentYearNum,
      currentYearLabel,
      programStartDate,
      programEndDate,
    };
  }, [activeSemester, semProgress.progressPercentage, calendarList]);

  const selectedSemesterInfo = getSemesterInfo(dayjs(currentDate).toDate(), activeSemData ? [activeSemData] : []);
  const semesterPhaseLabel = useCalendarActivity(selectedSemesterInfo);

  // Editing state for selected semester in modal
  const editingSemData = useMemo(() => {
    return full8Semesters.find((s) => s.semesterNumber === selectedSemForEdit) || full8Semesters[0];
  }, [full8Semesters, selectedSemForEdit]);

  const [editForm, setEditForm] = useState({
    startDate: '',
    endDate: '',
    fullName: '',
    session: '',
  });

  // Sync form state when pre-selected semester changes or modal opens
  React.useEffect(() => {
    if (isTimelineModalOpen && editingSemData) {
      setEditForm({
        startDate: editingSemData.startDate || '',
        endDate: editingSemData.endDate || '',
        fullName: editingSemData.fullName || `Semester ${editingSemData.semesterNumber}`,
        session: editingSemData.session || '',
      });
    }
  }, [selectedSemForEdit, isTimelineModalOpen, editingSemData]);

  const handleOpenTimelineEditor = (semNumberToPreselect?: number) => {
    playPop();
    if (semNumberToPreselect) {
      setSelectedSemForEdit(semNumberToPreselect);
    }
    setIsTimelineModalOpen(true);
  };

  const handleSaveSemDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.startDate || !editForm.endDate) {
      showToast('Please select valid start and end dates', 'error');
      return;
    }

    const payload: AcademicSemester = {
      ...editingSemData,
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      fullName: editForm.fullName.trim() || `Semester ${selectedSemForEdit}`,
      session: editForm.session.trim() || '',
      isEnabled: true,
    };

    playSuccess();
    await saveAcademicSemester(payload);
    showToast(`Updated Academic Timeline for Semester ${selectedSemForEdit}!`, 'success');
  };

  const handleResetDefaults = async () => {
    playClick();
    setIsTimelineModalOpen(false);
    onNavigateToCalendar?.();
  };

  return (
    <>
      <div data-academic-progress className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
        {/* Visual Bar 1: Overall Course Completion Percentage */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 sm:p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex flex-col justify-between relative overflow-hidden group"
        >
          {/* Ambient background glow */}
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white font-['Poppins','Inter',sans-serif] flex items-center gap-1.5">
                    Overall Course Completion
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    4-Year B.Tech CSE Degree Program Progress
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => handleOpenTimelineEditor(activeSemester)}
                    className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition border border-blue-200 dark:border-blue-800"
                    title="Admin: Change Academic Timeline Times & Dates"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 font-['Poppins','Inter',sans-serif]">
                    {overallCourseStats.overallPct}%
                  </span>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Degree Progress
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                  {overallCourseStats.currentYearLabel}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {overallCourseStats.completedSemesters} of {overallCourseStats.totalSemesters} Semesters Completed
                </span>
              </div>

              {/* Main Animated Bar Track (Clickable for Admin) */}
              <div
                onClick={() => (isAdmin ? handleOpenTimelineEditor(activeSemester) : onNavigateToCalendar && onNavigateToCalendar())}
                className={`h-3.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full p-0.5 border border-slate-200/50 dark:border-slate-800 shadow-inner relative overflow-hidden cursor-pointer ${
                  isAdmin ? 'hover:ring-2 hover:ring-blue-500/50' : ''
                }`}
                title={isAdmin ? 'Click to edit academic timeline dates' : 'Academic Timeline'}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallCourseStats.overallPct}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 shadow-md relative"
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                </motion.div>
              </div>

              {/* Semester Milestone Indicators */}
              <div className="grid grid-cols-8 gap-1 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
                  const isPassed = semNum < activeSemester;
                  const isCurrent = semNum === activeSemester;
                  return (
                    <button
                      key={semNum}
                      onClick={() => (isAdmin ? handleOpenTimelineEditor(semNum) : onNavigateToCalendar && onNavigateToCalendar())}
                      className="text-center group/sem relative cursor-pointer focus:outline-none"
                      title={isAdmin ? `Click to edit Semester ${semNum} dates` : `Semester ${semNum}`}
                    >
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isPassed
                            ? 'bg-emerald-500 group-hover/sem:scale-y-150'
                            : isCurrent
                            ? 'bg-blue-600 ring-2 ring-blue-500/40 animate-pulse group-hover/sem:scale-y-150'
                            : 'bg-slate-200 dark:bg-slate-800 group-hover/sem:bg-slate-400'
                        }`}
                      />
                      <span
                        className={`text-[9px] font-bold block mt-1 transition ${
                          isCurrent
                            ? 'text-blue-600 dark:text-blue-400 font-black scale-110'
                            : isPassed
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-600 group-hover/sem:text-slate-700 dark:group-hover/sem:text-slate-300'
                        }`}
                      >
                        S{semNum}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer info pills */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Degree Timeline:{' '}
                <strong>
                  {overallCourseStats.programStartDate && overallCourseStats.programEndDate ? `${dayjs(overallCourseStats.programStartDate).format('MMM YYYY')} – ${dayjs(overallCourseStats.programEndDate).format('MMM YYYY')}` : 'Not configured'}
                </strong>
              </span>
            </div>

            <button
              onClick={() => (isAdmin ? handleOpenTimelineEditor(activeSemester) : onNavigateToCalendar && onNavigateToCalendar())}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {isAdmin ? (
                <>
                  <Edit2 className="w-3 h-3" /> Edit Timeline Times & Dates
                </>
              ) : (
                <>
                  Academic Timeline <ChevronRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Visual Bar 2: Active Semester Progress */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 sm:p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex flex-col justify-between relative overflow-hidden group"
        >
          {/* Ambient background glow */}
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white font-['Poppins','Inter',sans-serif] flex items-center gap-1.5">
                    Semester {activeSemester} Progress
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {activeSemData ? activeSemData.fullName : `Semester ${activeSemester} Schedule`}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 font-['Poppins','Inter',sans-serif]">
                  {semProgress.progressPercentage}%
                </span>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Sem Completion
                </p>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-indigo-600 dark:text-indigo-400 text-[11px] font-bold flex items-center gap-1">
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  {semesterPhaseLabel}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {semProgress.daysCompleted} / {semProgress.totalDays} Days
                </span>
              </div>

              {/* Main Animated Bar Track */}
              <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full p-0.5 border border-slate-200/50 dark:border-slate-800 shadow-inner relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${semProgress.progressPercentage}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500 shadow-md relative"
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                </motion.div>
              </div>

              {/* Key Sub-metrics Row */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Days Elapsed</span>
                  <span className="text-xs font-black text-slate-800 dark:text-white font-mono">
                    {semProgress.daysCompleted} Days
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Remaining</span>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {semProgress.daysRemaining} Days
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Total Duration</span>
                  <span className="text-xs font-black text-slate-800 dark:text-white font-mono">
                    {semProgress.totalDays} Days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer info pills */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                Term Window:{' '}
                <strong className="text-slate-700 dark:text-slate-300">
                  {activeSemData ? `${dayjs(activeSemData.startDate).format('MMM D, YYYY')} – ${dayjs(activeSemData.endDate).format('MMM D, YYYY')}` : 'N/A'}
                </strong>
              </span>
            </div>
            {onNavigateToSubjects && (
              <button
                onClick={onNavigateToSubjects}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Sem Subjects <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Admin Academic Timeline Dates Modal */}
      <GlassModal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        title="Admin Academic Timeline & Semester Schedule Editor"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs">Academic Program Timeline Synchronizer</h4>
                <p className="text-[11px] text-blue-100 opacity-90">
                  Edit start & end dates for all 8 semesters. Changes reflect live for all students instantly.
                </p>
              </div>
            </div>
          </div>

          {/* 8 Semester Selector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
              const sem = full8Semesters.find((s) => s.semesterNumber === num);
              const isSelected = num === selectedSemForEdit;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedSemForEdit(num);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition whitespace-nowrap flex items-center gap-1 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Sem {num}
                  {sem?.startDate && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Form to edit selected semester dates */}
          <form onSubmit={handleSaveSemDates} className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-extrabold text-slate-800 dark:text-white text-sm">
                Configuring Semester {selectedSemForEdit} Schedule
              </span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-bold">
                B.Tech CSE • Year {Math.ceil(selectedSemForEdit / 2)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Semester Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Semester End Date *
                </label>
                <input
                  type="date"
                  required
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Display Title
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Session
                </label>
                <input
                  type="text"
                  value={editForm.session}
                  onChange={(e) => setEditForm({ ...editForm, session: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Manage Calendar
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md shadow-blue-500/20 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save & Sync Sem {selectedSemForEdit}
              </button>
            </div>
          </form>

          {/* Overview Table of All 8 Semester Schedule Times */}
          <div className="mt-3">
            <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-2">
              Full 8-Semester Degree Timeline Matrix
            </h5>
            <div className="scrollable-table-container custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Sem</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Start Date</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">End Date</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Session</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {full8Semesters.map((s) => (
                    <tr
                      key={s.semesterNumber}
                      className={`border-b border-slate-100 dark:border-slate-800/80 ${
                        s.semesterNumber === selectedSemForEdit ? 'bg-blue-50/70 dark:bg-blue-950/40 font-bold' : ''
                      }`}
                    >
                      <td className="p-2 font-mono text-blue-600 dark:text-blue-400">Sem {s.semesterNumber}</td>
                      <td className="p-2 font-mono">{s.startDate ? dayjs(s.startDate).format('MMM D, YYYY') : 'Not set'}</td>
                      <td className="p-2 font-mono">{s.endDate ? dayjs(s.endDate).format('MMM D, YYYY') : 'Not set'}</td>
                      <td className="p-2 font-mono">{s.session}</td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setSelectedSemForEdit(s.semesterNumber);
                          }}
                          className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold text-[10px] hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </GlassModal>
    </>
  );
};
