import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Save,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
  AlertCircle,
  Eye,
  Check,
  X,
  Palmtree,
  BookOpen,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AcademicSemester } from '../types';
import { useSound } from '../hooks/useSound';
import { useToast } from '../context/ToastContext';
import { GlassModal } from '../components/common/GlassModal';
import { SemesterProgressBar } from '../components/common/SemesterProgressBar';
import { getSemesterInfo } from '../utils/academicCalendarEngine';

export const AcademicCalendarManagementPage: React.FC = () => {
  const {
    user,
    academicCalendar,
    saveAcademicSemester,
    deleteAcademicSemester,
    restoreDefaultAcademicCalendar,
  } = useAppStore();

  const { playClick, playSuccess, playPop, playDelete } = useSound();
  const { addToast } = useToast();

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<AcademicSemester | null>(null);

  // Form Fields
  const [semNumber, setSemNumber] = useState<number>(3);
  const [semName, setSemName] = useState('Semester 3');
  const [semFullName, setSemFullName] = useState('Semester 3 (2nd Year • Autumn)');
  const [semSession, setSemSession] = useState('');
  const [semDepartment, setSemDepartment] = useState('Computer Science & Engineering');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isBreak, setIsBreak] = useState(false);
  const [description, setDescription] = useState('');

  // Delete Confirmation
  const [semToDelete, setSemToDelete] = useState<AcademicSemester | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Calculate live preview info based on currently cached academic calendar
  const previewInfo = useMemo(() => {
    return getSemesterInfo(new Date(), academicCalendar);
  }, [academicCalendar]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  };

  // Security Guard
  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs my-6 space-y-3 max-w-xl mx-auto">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Admin Authorization Required</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The Academic Calendar Control Panel is strictly reserved for Faculty Administrators and HOD. Students may view current calendar dates in the Academic Calendar view.
        </p>
      </div>
    );
  }

  const handleOpenAddModal = () => {
    playPop();
    setEditingSemester(null);
    const nextNum = (academicCalendar?.length || 0) + 1;
    setSemNumber(nextNum);
    setSemName(`Semester ${nextNum}`);
    setSemFullName(`Semester ${nextNum} (CSE Department)`);
    setSemSession('');
    setSemDepartment('Computer Science & Engineering');
    setStartDate('');
    setEndDate('');
    setIsEnabled(true);
    setIsBreak(false);
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sem: AcademicSemester) => {
    playPop();
    setEditingSemester(sem);
    setSemNumber(sem.semesterNumber || sem.id);
    setSemName(sem.name);
    setSemFullName(sem.fullName);
    setSemSession(sem.session);
    setSemDepartment(sem.department);
    setStartDate(sem.startDate);
    setEndDate(sem.endDate);
    setIsEnabled(sem.isEnabled);
    setIsBreak(!!sem.isBreak);
    setDescription(sem.description || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semName.trim() || !startDate || !endDate) {
      addToast('Please fill in all required date and title fields.', 'error');
      return;
    }

    const payload: AcademicSemester = {
      id: editingSemester ? editingSemester.id : semNumber,
      semesterNumber: semNumber,
      name: semName.trim(),
      fullName: semFullName.trim() || semName.trim(),
      session: semSession.trim(),
      department: semDepartment.trim() || 'Computer Science & Engineering',
      startDate,
      endDate,
      isEnabled,
      isBreak,
      description: description.trim(),
    };

    await saveAcademicSemester(payload);
    playSuccess();
    setIsModalOpen(false);
    addToast(
      editingSemester
        ? `Successfully updated calendar for ${payload.name}!`
        : `Added ${payload.name} to global Academic Calendar!`,
      'success'
    );
  };

  const handleToggleEnable = async (sem: AcademicSemester) => {
    playClick();
    const updated: AcademicSemester = { ...sem, isEnabled: !sem.isEnabled };
    await saveAcademicSemester(updated);
    addToast(`${sem.name} ${updated.isEnabled ? 'enabled' : 'disabled'}.`, 'info');
  };

  const handleToggleBreak = async (sem: AcademicSemester) => {
    playClick();
    const updated: AcademicSemester = { ...sem, isBreak: !sem.isBreak };
    await saveAcademicSemester(updated);
    addToast(`${sem.name} marked as ${updated.isBreak ? 'Semester Break' : 'Academic Semester'}.`, 'info');
  };

  const handleDeleteConfirm = async () => {
    if (!semToDelete) return;
    const name = semToDelete.name;
    const id = semToDelete.id;
    setSemToDelete(null);
    await deleteAcademicSemester(id);
    playDelete();
    addToast(`Deleted ${name} from academic calendar.`, 'info');
  };

  const handleRestoreDefault = async () => {
    setIsResetConfirmOpen(false);
    await restoreDefaultAcademicCalendar();
    playSuccess();
    addToast('Academic calendar cleared. Add your own semester dates.', 'success');
  };


  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-6 w-full min-w-0 pb-16"
    >
      {/* Header Banner */}
      <motion.div
        variants={cardVariants}
        className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Admin Academic Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Academic Calendar Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Configure dynamic semester date boundaries, breaks, and academic sessions. Updates automatically synchronize in real-time across all student dashboards with zero page reload.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <button
            onClick={() => {
              playPop();
              setIsResetConfirmOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center gap-2 border border-slate-200/60 dark:border-slate-700/60"
          >
            <RotateCcw className="w-4 h-4" /> Clear Calendar
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Semester Entry
          </button>
        </div>
      </motion.div>

      {/* Real-time System Auto-Detection Preview Widget */}
      <motion.div
        variants={cardVariants}
        className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-900/10 via-indigo-900/5 to-slate-900/10 dark:from-blue-950/40 dark:via-slate-900/60 dark:to-indigo-950/40 backdrop-blur-xl border border-blue-500/30 dark:border-blue-500/20 shadow-md space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Live Dynamic Engine Preview (Today: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calculated in real-time from active calendar database records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full font-extrabold text-xs border ${
                previewInfo.status === 'Semester Active'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
            >
              Status: {previewInfo.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
            <div className="text-[10px] uppercase font-extrabold text-slate-400">Detected Semester</div>
            <div className="font-black text-slate-900 dark:text-white text-base truncate">
              {previewInfo.semesterName}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {previewInfo.fullName}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
            <div className="text-[10px] uppercase font-extrabold text-slate-400">Academic Session & Dept</div>
            <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
              {previewInfo.academicSession}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 truncate">
              {previewInfo.department}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
            <div className="text-[10px] uppercase font-extrabold text-slate-400">Date Range</div>
            <div className="font-mono font-bold text-slate-900 dark:text-white">
              {previewInfo.startDate} → {previewInfo.endDate}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Total Duration: {previewInfo.totalDays} Days
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase font-extrabold text-slate-400">
              <span>Current Semester Progress</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-black">{previewInfo.progressPercentage}%</span>
            </div>
            <SemesterProgressBar
              percentage={previewInfo.progressPercentage}
              showLabels
              showPhaseBadges
              isBreak={previewInfo.status === 'Semester Break'}
            />
            <div className="text-[10px] text-slate-500 flex justify-between font-mono pt-0.5">
              <span>{previewInfo.daysCompleted} d completed</span>
              <span>{previewInfo.daysRemaining} d left</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Semester Roster Table */}
      <motion.div
        variants={cardVariants}
        className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Configured Academic Semesters ({academicCalendar.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage start dates, end dates, break flags, and department defaults.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold">
                <th className="p-3.5 border border-slate-200/60 dark:border-slate-700/60">Semester / Name</th>
                <th className="p-3.5 border border-slate-200/60 dark:border-slate-700/60">Academic Session</th>
                <th className="p-3.5 border border-slate-200/60 dark:border-slate-700/60">Department</th>
                <th className="p-3.5 border border-slate-200/60 dark:border-slate-700/60">Start Date</th>
                <th className="p-3.5 border border-slate-200/60 dark:border-slate-700/60">End Date</th>
                <th className="p-3.5 border border-slate-200/60 dark:border-slate-700/60 text-center">Break</th>
                <th className="p-3.5 border border-slate-200/60 dark:border-slate-700/60 text-center">Status</th>
                <th className="p-3.5 border border-slate-200/60 dark:border-slate-700/60 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {academicCalendar.map((sem) => {
                const isActiveThis = sem.id === previewInfo.currentSemesterId;

                return (
                  <tr
                    key={sem.id}
                    className={`border-b border-slate-200/40 dark:border-slate-800/40 transition ${
                      isActiveThis
                        ? 'bg-blue-500/10 dark:bg-blue-900/20'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 font-mono font-extrabold flex items-center justify-center shrink-0">
                          S{sem.semesterNumber || sem.id}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{sem.name}</span>
                            {isActiveThis && (
                              <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-600 text-white rounded-md">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">{sem.fullName}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-bold">{sem.session}</td>

                    <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                      {sem.department}
                    </td>

                    <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">{sem.startDate}</td>

                    <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">{sem.endDate}</td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggleBreak(sem)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition flex items-center gap-1 mx-auto ${
                          sem.isBreak
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}
                      >
                        <Palmtree className="w-3 h-3" />
                        <span>{sem.isBreak ? 'Yes' : 'No'}</span>
                      </button>
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggleEnable(sem)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                          sem.isEnabled
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {sem.isEnabled ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(sem)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>

                        <button
                          onClick={() => {
                            playPop();
                            setSemToDelete(sem);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add / Edit Semester Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSemester ? `Edit Calendar Entry: ${editingSemester.name}` : 'Add New Academic Semester'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Semester Number</label>
              <input
                type="number"
                min="1"
                max="12"
                required
                value={semNumber}
                onChange={(e) => setSemNumber(Number(e.target.value))}
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Short Name</label>
              <input
                type="text"
                required
                value={semName}
                onChange={(e) => setSemName(e.target.value)}
                placeholder="e.g. Semester 3"
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Title & Year Description</label>
            <input
              type="text"
              required
              value={semFullName}
              onChange={(e) => setSemFullName(e.target.value)}
              placeholder="e.g. Semester 3 (2nd Year • Autumn)"
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Session</label>
              <input
                type="text"
                required
                value={semSession}
                onChange={(e) => setSemSession(e.target.value)}
                placeholder="e.g. 2026-2027"
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <input
                type="text"
                required
                value={semDepartment}
                onChange={(e) => setSemDepartment(e.target.value)}
                placeholder="Computer Science & Engineering"
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Start Date (YYYY-MM-DD)</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">End Date (YYYY-MM-DD)</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-bold text-slate-800 dark:text-slate-200">Enable Semester</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBreak}
                onChange={(e) => setIsBreak(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="font-bold text-slate-800 dark:text-slate-200">Mark as Semester Break</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Academic Semester
          </button>
        </form>
      </GlassModal>

      {/* Delete Confirmation Modal */}
      <GlassModal
        isOpen={!!semToDelete}
        onClose={() => setSemToDelete(null)}
        title="Confirm Calendar Deletion"
      >
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <p>
            Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{semToDelete?.name}</strong> from the academic calendar?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setSemToDelete(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold shadow-md shadow-rose-500/20"
            >
              Delete Semester
            </button>
          </div>
        </div>
      </GlassModal>

      {/* Clear Calendar Modal */}
      <GlassModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Clear Academic Calendar"
      >
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <p>
            This clears the academic calendar for your editing scope. Semester dates will be empty until you add new entries.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsResetConfirmOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleRestoreDefault}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Clear Calendar
            </button>
          </div>
        </div>
      </GlassModal>
    </motion.div>
  );
};
