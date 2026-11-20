import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Grid,
  Clock,
  User,
  MapPin,
  BookOpen,
  FolderDown,
  Info,
  X,
  Building,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  ShieldCheck,
  FileText,
  Sliders,
  RefreshCw,
  Settings2,
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { MobileTimetable } from '../components/common/MobileTimetable';
import { useSchedule } from '../hooks/useSchedule';
import { TimetableSlot, Subject } from '../types';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { formatTimeSlot12h } from '../utils/formatTime';
import { useSound } from '../hooks/useSound';
import { useToast } from '../context/ToastContext';
import { GlassModal } from '../components/common/GlassModal';
import { MIN_SUBJECT_ATTENDANCE_PERCENT, attendanceSemester, getSubjectAttendance } from '../utils/attendanceThreshold';

export const TimetablePage: React.FC = () => {
  const [showMobileGrid, setShowMobileGrid] = useState(false);
  const { playClick, playSuccess, playDelete } = useSound();
  const { showToast } = useToast();

  const { activeSemester, setActiveSemester, semesterTimetable, getSlotForDayAndTime } = useSchedule();
  const {
    user,
    subjects,
    attendance,
    timeSlots,
    updateTimeSlots,
    addTimetableSlot,
    updateTimetableSlot,
    deleteTimetableSlot,
  } = useAppStore();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);

  // Add / Edit Slot Modal State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isSavingSlot, setIsSavingSlot] = useState(false);
  const [slotSaveError, setSlotSaveError] = useState('');
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);

  // Grid Time Slots Customization Modal State
  const [isTimeConfigModalOpen, setIsTimeConfigModalOpen] = useState(false);
  const [tempTimeSlots, setTempTimeSlots] = useState<string[]>([]);
  const [newTimeSlotInput, setNewTimeSlotInput] = useState('');

  // Form State for Slot Writing & Details
  const [slotFormData, setSlotFormData] = useState({
    day: 'Monday' as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday',
    timeSlot: '10:00-10:50',
    subjectCode: '',
    subjectName: '',
    faculty: '',
    room: '',
    type: 'Theory' as 'Theory' | 'Lab' | 'Break',
    credits: 4,
    notes: '',
  });

  const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  const currentDayName = dayjs().format('dddd');

  // Filter subjects for current semester reference table
  const semesterSubjects = subjects.filter((s) => {
    if (s.semester) return s.semester === activeSemester;
    return activeSemester === 2;
  });

  const getSlotState = (day: string, slotTime: string) => {
    if (day !== currentDayName) {
      return 'normal';
    }
    const [start, end] = slotTime.split('-');
    if (!start || !end) return 'normal';
    let [sH, sM] = start.split(':').map(Number);
    let [eH, eM] = end.split(':').map(Number);
    if (sH >= 1 && sH <= 7) sH += 12;
    if (eH >= 1 && eH <= 7) eH += 12;

    const nowH = dayjs().hour();
    const nowM = dayjs().minute();
    const nowMins = nowH * 60 + nowM;
    const startMins = sH * 60 + (sM || 0);
    const endMins = eH * 60 + (eM || 0);

    if (nowMins >= startMins && nowMins <= endMins) {
      return 'current';
    }
    if (nowMins < startMins) {
      return 'upcoming';
    }
    return 'completed';
  };

  const getAttendanceStatusForSubject = (code: string) => {
    const record = attendance.find((entry) =>
      entry.studentId === user?.uid && entry.subjectCode === code && attendanceSemester(entry) === Number(activeSemester)
    );
    if (!record) return { label: 'No classes recorded', belowMinimum: false };
    const summary = getSubjectAttendance(record);
    return {
      label: summary.percentage === null ? 'No classes recorded' : `${summary.percentage.toFixed(1)}%${summary.belowMinimum ? ` · Below ${MIN_SUBJECT_ATTENDANCE_PERCENT}%` : ''}`,
      belowMinimum: summary.belowMinimum,
    };
  };

  const selectedSlotAttendance = selectedSlot ? getAttendanceStatusForSubject(selectedSlot.subjectCode) : null;

  const openAddSlotModal = (
    day?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday',
    slotTime?: string
  ) => {
    playClick();
    setEditingSlot(null);
    setSlotSaveError('');
    const firstSubject = semesterSubjects[0];
    setSlotFormData({
      day: day || 'Monday',
      timeSlot: slotTime || timeSlots[0] || '10:00-10:50',
      subjectCode: firstSubject?.code || '',
      subjectName: firstSubject?.name || '',
      faculty: firstSubject?.faculty || '',
      room: firstSubject?.room || 'N 403',
      type: (firstSubject?.type as any) || 'Theory',
      credits: firstSubject?.credits || 4,
      notes: '',
    });
    setIsSlotModalOpen(true);
  };

  const openEditSlotModal = (slot: TimetableSlot) => {
    playClick();
    setEditingSlot(slot);
    setSlotSaveError('');
    setSlotFormData({
      day: slot.day,
      timeSlot: slot.timeSlot,
      subjectCode: slot.subjectCode,
      subjectName: slot.subjectName,
      faculty: slot.faculty,
      room: slot.room,
      type: slot.type,
      credits: slot.credits,
      notes: slot.notes || '',
    });
    setSelectedSlot(null);
    setIsSlotModalOpen(true);
  };

  const handleSelectSubjectChange = (code: string) => {
    const selected = semesterSubjects.find((s) => s.code === code);
    if (selected) {
      setSlotFormData((prev) => ({
        ...prev,
        subjectCode: selected.code,
        subjectName: selected.name,
        faculty: selected.faculty,
        room: selected.room,
        type: (selected.type as any) || 'Theory',
        credits: selected.credits,
      }));
    } else {
      setSlotFormData((prev) => ({ ...prev, subjectCode: code }));
    }
  };

  const handleSubmitSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotFormData.subjectCode.trim() || !slotFormData.subjectName.trim()) {
      showToast('Subject Code and Subject Name are required', 'error');
      return;
    }

    if (isSavingSlot) return;
    setIsSavingSlot(true);
    setSlotSaveError('');
    try {
    if (editingSlot) {
      const updated: TimetableSlot = {
        ...editingSlot,
        day: slotFormData.day,
        timeSlot: slotFormData.timeSlot,
        subjectCode: slotFormData.subjectCode.trim().toUpperCase(),
        subjectName: slotFormData.subjectName.trim(),
        faculty: slotFormData.faculty.trim() || 'Faculty In-Charge',
        room: slotFormData.room.trim() || 'TBA',
        type: slotFormData.type,
        credits: Number(slotFormData.credits) || 0,
        semester: activeSemester,
        notes: slotFormData.notes.trim(),
      };
      await updateTimetableSlot(updated);
      showToast(isAdmin ? 'Slot published to all students' : 'Slot saved to your account only', 'success');
    } else {
      const newSlot: TimetableSlot = {
        id: `slot_${Date.now()}`,
        day: slotFormData.day,
        timeSlot: slotFormData.timeSlot,
        subjectCode: slotFormData.subjectCode.trim().toUpperCase(),
        subjectName: slotFormData.subjectName.trim(),
        faculty: slotFormData.faculty.trim() || 'Faculty In-Charge',
        room: slotFormData.room.trim() || 'TBA',
        type: slotFormData.type,
        credits: Number(slotFormData.credits) || 0,
        semester: activeSemester,
        notes: slotFormData.notes.trim(),
      };
      await addTimetableSlot(newSlot);
      showToast(isAdmin ? 'Slot published to all students' : 'Slot saved to your account only', 'success');
    }

    setIsSlotModalOpen(false);
    playSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Slot could not be saved. Try again.';
      setSlotSaveError(message);
      showToast(message, 'error');
    } finally {
      setIsSavingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteTimetableSlot(slotId);
      playDelete();
      setSelectedSlot(null);
      showToast(isAdmin ? 'Slot removed for all students' : 'Slot removed from your account only', 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Slot could not be deleted.', 'error');
    }
  };

  // Time Slots Editor Logic
  const openTimeConfigModal = () => {
    playClick();
    setTempTimeSlots([...timeSlots]);
    setNewTimeSlotInput('');
    setIsTimeConfigModalOpen(true);
  };

  const handleSaveTimeConfig = async () => {
    if (tempTimeSlots.length === 0) {
      showToast('At least one time slot is required', 'error');
      return;
    }
    try {
      await updateTimeSlots(tempTimeSlots);
      playSuccess();
      setIsTimeConfigModalOpen(false);
      showToast(isAdmin ? 'Grid times published to all students' : 'Grid times saved to your account only', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Grid times could not be saved.', 'error');
    }
  };

  const handleAddTempTimeSlot = () => {
    if (!newTimeSlotInput.trim()) return;
    const formatted = newTimeSlotInput.trim();
    if (tempTimeSlots.includes(formatted)) {
      showToast('Time slot already exists', 'warning');
      return;
    }
    setTempTimeSlots([...tempTimeSlots, formatted]);
    setNewTimeSlotInput('');
  };

  const handleRemoveTempTimeSlot = (idx: number) => {
    setTempTimeSlots(tempTimeSlots.filter((_, i) => i !== idx));
  };

  const handleMoveTempTimeSlot = (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= tempTimeSlots.length) return;
    const updated = [...tempTimeSlots];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setTempTimeSlots(updated);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-6 w-full min-w-0 pb-12"
    >
      {/* Admin Full Access & Sync Banner */}
      {isAdmin && (
        <motion.div
          variants={cardVariants}
          className="p-4 sm:p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-400/30"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-200 font-extrabold text-[10px] tracking-wider uppercase border border-emerald-300/30">
                  Admin Control Panel Active
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Real-time Student Sync
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black tracking-tight mt-0.5">
                Full Read, Write & Change Rights Granted
              </h2>
              <p className="text-xs text-emerald-100 opacity-90">
                Edit academic timeline grid times, subject information, venue codes, and custom slot notes. All changes publish live to all student devices instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <button
              onClick={openTimeConfigModal}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-xs transition border border-white/20 flex items-center gap-1.5 shadow-sm"
            >
              <Settings2 className="w-4 h-4 text-emerald-300" /> Edit Grid Times
            </button>
            <button
              onClick={() => openAddSlotModal()}
              className="px-4 py-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs transition flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          </div>
        </motion.div>
      )}

      {/* Timetable Official Header Banner */}
      <motion.div
        layoutId="card-timetable"
        variants={cardVariants}
        className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative overflow-hidden space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Building className="w-4 h-4" /> StudentOS
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              B.TECH CSE • SEMESTER {activeSemester} TIMETABLE
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Department of Computer Science & Engineering • Section <strong className="text-slate-800 dark:text-slate-200">CSE A</strong> • Room <strong className="text-slate-800 dark:text-slate-200">N 403</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 overflow-x-auto max-w-full custom-scrollbar p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <button
                  key={sem}
                  onClick={() => {
                    playClick();
                    setActiveSemester(sem);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeSemester === sem
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sem {sem}
                </button>
              ))}
            </div>

            {(isAdmin || user?.dataAccess === 'Full Read & Write') && (
              <button
                onClick={openTimeConfigModal}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shrink-0"
              >
                <Sliders className="w-4 h-4 text-blue-500" /> Grid Headers
              </button>
            )}

            <button
              onClick={() => openAddSlotModal()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          </div>
        </div>
      </motion.div>

      <MobileTimetable slots={semesterTimetable} today={currentDayName} onSelect={(slot) => { playClick(); setSelectedSlot(slot); }} />
      <button className="md:hidden w-full min-h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 text-xs font-bold" aria-expanded={showMobileGrid} aria-controls="weekly-timetable-grid" onClick={() => setShowMobileGrid(!showMobileGrid)}>
        {showMobileGrid ? 'Hide weekly grid' : 'View full weekly grid'}
      </button>
      {/* Grid Timetable Container */}
      <motion.div
        variants={cardVariants}
        id="weekly-timetable-grid"
        className={`${showMobileGrid ? 'block' : 'hidden md:block'} p-4 sm:p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs scrollable-table-container custom-scrollbar min-w-0 w-full overflow-x-auto`}
      >
        <table
          className="w-full table-fixed text-xs text-left border-collapse border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden"
          style={{ minWidth: `${Math.max(960, 112 + timeSlots.length * 132)}px` }}
        >
          <thead>
            <tr className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-bold text-center">
              <th className="p-3 border-r border-blue-600/50 w-28 uppercase tracking-wider text-[10px]">Day / Time</th>
              {timeSlots.map((t) => (
                <th key={t} className="p-2.5 border-r border-blue-600/50 text-[11px] whitespace-nowrap">
                  {formatTimeSlot12h(t)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const isToday = day === currentDayName;
              return (
                <tr
                  key={day}
                  className={`border-b border-slate-100 dark:border-slate-800/80 ${
                    isToday ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  {/* Day Header Column */}
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100 bg-purple-100/50 dark:bg-purple-950/30 border-r border-slate-200/80 dark:border-slate-800/80 text-center uppercase tracking-wide">
                    {day}
                  </td>

                  {/* Time Slots */}
                  {timeSlots.map((slotTime) => {
                    if (slotTime.toLowerCase().includes('break') || slotTime === '12:30-1:00') {
                      return (
                        <td
                          key={slotTime}
                          className="p-2 border-r border-slate-200/80 dark:border-slate-800/80 bg-amber-50/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 font-extrabold text-center tracking-widest text-[10px]"
                        >
                          BREAK
                        </td>
                      );
                    }

                    const slot = getSlotForDayAndTime(day, slotTime);

                    if (!slot) {
                      return (
                        <td
                          key={slotTime}
                          className="p-1 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/30 group hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition cursor-pointer"
                          onClick={() => openAddSlotModal(day, slotTime)}
                        >
                          <div className="w-full h-full min-h-[52px] rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                            <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition scale-90 group-hover:scale-100" />
                          </div>
                        </td>
                      );
                    }

                    const state = getSlotState(day, slotTime);
                    const isLab = slot.type === 'Lab';
                    const hasNotes = !!slot.notes;

                    return (
                      <td key={slotTime} className="p-1 border-r border-slate-200/80 dark:border-slate-800/80">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => {
                            playClick();
                            setSelectedSlot(slot);
                          }}
                          className={`w-full h-full p-2 rounded-xl text-left transition relative overflow-hidden flex flex-col justify-between ${
                            state === 'current'
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400 animate-pulse'
                              : state === 'completed'
                              ? 'bg-slate-100/80 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 line-through'
                              : isLab
                              ? 'bg-purple-50/80 dark:bg-purple-900/20 text-purple-900 dark:text-purple-200 border border-purple-200/60 dark:border-purple-800/40 hover:bg-purple-100/80'
                              : 'bg-blue-50/80 dark:bg-blue-900/20 text-slate-800 dark:text-slate-200 border border-blue-100/80 dark:border-blue-900/30 hover:bg-blue-100/80'
                          }`}
                        >
                          <div>
                            <div className="font-extrabold text-[11px] leading-tight truncate flex items-center justify-between gap-1">
                              <span className="truncate">{slot.subjectCode}</span>
                              {hasNotes && (
                                <span title="Class Note Attached" className="shrink-0 inline-flex">
                                  <FileText className="w-3 h-3 text-amber-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] opacity-80 mt-0.5 truncate font-semibold">
                              {slot.faculty}
                            </div>
                          </div>

                          <div className="mt-1 flex items-center justify-between text-[9px] font-mono opacity-90">
                            <span>{slot.room}</span>
                            <span className="px-1 py-0.2 rounded bg-black/10 font-bold">{slot.type}</span>
                          </div>
                        </motion.button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Subject Code & Faculty Reference Legend Table */}
      <motion.div
        variants={cardVariants}
        className="p-5 sm:p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs min-w-0 w-full"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0" /> Subject Code & Faculty Master Reference (Semester {activeSemester})
          </h3>
          <button
            onClick={() => {
              playClick();
              navigate('/subjects');
            }}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Manage Subjects &rarr;
          </button>
        </div>

        {semesterSubjects.length > 0 ? (
          <div className="scrollable-table-container custom-scrollbar border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold">
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Code</th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Subject Name</th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Faculty In-Charge</th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center">Structure</th>
                </tr>
              </thead>
              <tbody>
                {semesterSubjects.map((sub) => (
                  <tr key={sub.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">{sub.code}</td>
                    <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{sub.name}</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-300">{sub.faculty}</td>
                    <td className="p-2.5 text-center font-semibold text-purple-600 dark:text-purple-300">
                      {sub.type === 'Theory' ? `${sub.credits} Credits` : `${sub.credits} Lab Credits`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            No subjects created for Semester {activeSemester} yet. Click "Manage Subjects" or "Add Slot" to configure subjects.
          </p>
        )}
      </motion.div>

      {/* Slot Details & Writing View Modal */}
      <GlassModal
        isOpen={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        title={selectedSlot ? `${selectedSlot.subjectCode} - ${selectedSlot.subjectName}` : ''}
      >
        {selectedSlot && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <Clock className="w-4 h-4 shrink-0" /> {selectedSlot.day} • {formatTimeSlot12h(selectedSlot.timeSlot)}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold">
                {selectedSlot.subjectCode}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                {selectedSlot.type} ({selectedSlot.credits} Credits)
              </span>
            </div>

            {/* Custom Notes / Class Writing Display */}
            {selectedSlot.notes && (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <FileText className="w-4 h-4 text-amber-600" /> Slot Instructions / Notes:
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{selectedSlot.notes}</p>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Faculty In-Charge:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedSlot.faculty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Classroom Location:</span>
                <span className="font-bold text-slate-900 dark:text-white">Room {selectedSlot.room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Your Current Attendance:</span>
                <span className={`font-bold ${selectedSlotAttendance?.belowMinimum ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {selectedSlotAttendance?.label}
                </span>
              </div>
            </div>

            {/* Edit / Delete / Quick Actions */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openEditSlotModal(selectedSlot)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4 text-blue-500" /> Edit Slot & Writing
                </button>
                <button
                  onClick={() => handleDeleteSlot(selectedSlot.id)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Delete Slot
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    playClick();
                    setSelectedSlot(null);
                    navigate(`/subjects?code=${selectedSlot.subjectCode}`);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition flex items-center justify-center gap-1.5 shadow-sm w-full"
                >
                  <BookOpen className="w-4 h-4" /> Syllabus & Books
                </button>
              </div>
            </div>
          </div>
        )}
      </GlassModal>

      {/* Add / Edit Slot & Writing Modal */}
      <GlassModal
        isOpen={isSlotModalOpen}
        onClose={() => { if (!isSavingSlot) setIsSlotModalOpen(false); }}
        title={editingSlot ? 'Edit Slot & Writing Details' : `Add Timetable Slot (Semester ${activeSemester})`}
        footer={<div className="space-y-2 text-xs">{slotSaveError && <p role="alert" className="text-rose-600 dark:text-rose-400">{slotSaveError}</p>}<div className="flex items-center justify-end gap-2">
          <button type="button" disabled={isSavingSlot} onClick={() => setIsSlotModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold disabled:opacity-50">Cancel</button>
          <button type="submit" form="timetable-slot-form" disabled={isSavingSlot} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50">{isSavingSlot ? 'Saving…' : isAdmin ? 'Save & publish' : 'Save to my account'}</button>
        </div></div>}
      >
        <form id="timetable-slot-form" onSubmit={handleSubmitSlot} className="space-y-4 text-xs" aria-busy={isSavingSlot}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Day
              </label>
              <select
                value={slotFormData.day}
                onChange={(e) => setSlotFormData({ ...slotFormData, day: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Time Slot
              </label>
              <select
                value={slotFormData.timeSlot}
                onChange={(e) => setSlotFormData({ ...slotFormData, timeSlot: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {timeSlots.map((t) => (
                  <option key={t} value={t}>
                    {formatTimeSlot12h(t)} ({t})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {semesterSubjects.length > 0 && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Quick Select Subject (Sem {activeSemester})
              </label>
              <select
                value={slotFormData.subjectCode}
                onChange={(e) => handleSelectSubjectChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Choose existing subject or type below --</option>
                {semesterSubjects.map((sub) => (
                  <option key={sub.id} value={sub.code}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PCC-CS301"
                value={slotFormData.subjectCode}
                onChange={(e) => setSlotFormData({ ...slotFormData, subjectCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Data Structures"
                value={slotFormData.subjectName}
                onChange={(e) => setSlotFormData({ ...slotFormData, subjectName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Faculty
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. A. Ghosh"
                value={slotFormData.faculty}
                onChange={(e) => setSlotFormData({ ...slotFormData, faculty: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Room No. / Venue
              </label>
              <input
                type="text"
                placeholder="e.g. N 403"
                value={slotFormData.room}
                onChange={(e) => setSlotFormData({ ...slotFormData, room: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Slot Type
              </label>
              <select
                value={slotFormData.type}
                onChange={(e) => setSlotFormData({ ...slotFormData, type: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Theory">Theory</option>
                <option value="Lab">Lab</option>
                <option value="Break">Break</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Credits
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={slotFormData.credits}
                onChange={(e) => setSlotFormData({ ...slotFormData, credits: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Writing / Custom Class Instructions */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Class Writing / Special Instructions</span>
              <span className="text-[10px] text-slate-400 font-normal">{isAdmin ? 'Published to all students' : 'Private to your account'}</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Bring Lab Manual #2, Mid-Sem Test in Room N 405, or extra assignment submission instructions..."
              value={slotFormData.notes}
              onChange={(e) => setSlotFormData({ ...slotFormData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

        </form>
      </GlassModal>

      {/* Grid Time Slots Customization Modal */}
      <GlassModal
        isOpen={isTimeConfigModalOpen}
        onClose={() => setIsTimeConfigModalOpen(false)}
        title={isAdmin ? 'Publish Grid Times' : 'My Grid Times'}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Real-time Grid Header Synchronization
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed">
              Add, edit, reorder, or remove period time slot headers (e.g. <code className="font-bold font-mono">10:00-10:50</code>). All student timetables update instantly in sync upon saving.
            </p>
          </div>

          {/* Add New Time Slot Row */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 09:00-09:50 or 05:10-06:00"
              value={newTimeSlotInput}
              onChange={(e) => setNewTimeSlotInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={handleAddTempTimeSlot}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shrink-0 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {/* Editable List of Time Slots */}
          <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar p-1">
            {tempTimeSlots.map((ts, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 gap-2"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-6 text-center text-slate-400 font-bold font-mono text-[10px]">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={ts}
                    onChange={(e) => {
                      const updated = [...tempTimeSlots];
                      updated[idx] = e.target.value;
                      setTempTimeSlots(updated);
                    }}
                    className="flex-1 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-xs"
                  />
                  <span className="text-[10px] text-slate-400 whitespace-nowrap hidden sm:inline">
                    {formatTimeSlot12h(ts)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMoveTempTimeSlot(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveTempTimeSlot(idx, 'down')}
                    disabled={idx === tempTimeSlots.length - 1}
                    className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemoveTempTimeSlot(idx)}
                    className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/50 hover:bg-rose-200 text-rose-600 dark:text-rose-400 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setTempTimeSlots(['10:00-10:50', '10:50-11:40', '11:40-12:30', '12:30-1:00', '1:00-1:50', '1:50-2:40', '2:40-3:30', '3:30-4:20', '4:20-5:10'])}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset Default Headers
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTimeConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTimeConfig}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-md shadow-emerald-500/20"
              >
                {isAdmin ? 'Save & Publish Grid Headers' : 'Save My Grid Headers'}
              </button>
            </div>
          </div>
        </div>
      </GlassModal>
    </motion.div>
  );
};
