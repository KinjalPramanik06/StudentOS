import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  Users,
  Calendar,
  Award,
  Plus,
  Edit2,
  Save,
  UserCheck,
  Palmtree,
  Trash2,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  Database,
  Activity,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { UserProfile, MarksRecord, AttendanceRecord, CalendarEvent, Holiday } from '../types';
import { marksRecordSchema, attendanceRecordSchema } from '../lib/validation';
import { useSound } from '../hooks/useSound';
import { useToast } from '../context/ToastContext';
import { ProfileAvatar } from '../components/common/ProfileAvatar';
import { GlassModal } from '../components/common/GlassModal';
import { verifyDatabaseHealth } from '../services/storageService';
import { attendanceSemester } from '../utils/attendanceThreshold';

import { AcademicCalendarManagementPage } from './AcademicCalendarManagementPage';

export const AdminPanelPage: React.FC = () => {
  const {
    user,
    allStudents,
    subjects,
    attendance,
    marks,
    calendarEvents,
    holidays,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    clearAllHolidays,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    clearAllCalendarEvents,
    addStudent,
    updateUserProfile,
    deleteStudent,
    resetAllAttendance,
    updateMarks,
    updateAttendance,
    massDeleteAcademicData,
    resetToDefaultData,
  } = useAppStore();

  const { playClick, playSuccess, playPop } = useSound();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'Students' | 'Academic Calendar' | 'Marks' | 'Exams' | 'Holidays' | 'Cleanup'>('Students');

  // Data Access Live Metrics
  const fullAccessCount = allStudents.filter(
    (s) => (s.dataAccess || 'Full Read & Write') === 'Full Read & Write'
  ).length;
  const readOnlyCount = allStudents.filter(
    (s) => s.dataAccess === 'Read Only'
  ).length;
  const restrictedCount = allStudents.filter(
    (s) => s.dataAccess === 'Restricted'
  ).length;

  // Add Student Modal State
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStdName, setNewStdName] = useState('');
  const [newStdEmail, setNewStdEmail] = useState('');
  const [newStdRoll, setNewStdRoll] = useState('');
  const [newStdReg, setNewStdReg] = useState('');
  const [newStdPhone, setNewStdPhone] = useState('');
  const [newStdBlood, setNewStdBlood] = useState('O+');
  const [newStdSection, setNewStdSection] = useState('CSE A');
  const [newStdPhoto, setNewStdPhoto] = useState('');

  // Edit Student Modal state
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBlood, setEditBlood] = useState('O+');
  const [editRoll, setEditRoll] = useState('');
  const [editReg, setEditReg] = useState('');
  const [editSection, setEditSection] = useState('CSE A');
  const [editPhoto, setEditPhoto] = useState('');
  const [editDataAccess, setEditDataAccess] = useState<'Full Read & Write' | 'Read Only' | 'Restricted'>('Full Read & Write');
  const [newStdDataAccess, setNewStdDataAccess] = useState<'Full Read & Write' | 'Read Only' | 'Restricted'>('Full Read & Write');

  // Exam / Event CRUD state
  const [editingExam, setEditingExam] = useState<CalendarEvent | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examCategory, setExamCategory] = useState<'Exam' | 'Academic' | 'Event' | 'Registration'>('Exam');
  const [examDate, setExamDate] = useState('');
  const [examEndDate, setExamEndDate] = useState('');
  const [examDesc, setExamDesc] = useState('');

  // Holiday CRUD state
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holTitle, setHolTitle] = useState('');
  const [holDate, setHolDate] = useState('');
  const [holCategory, setHolCategory] = useState<'National' | 'College' | 'Festival' | 'Vacation'>('Festival');
  const [holDesc, setHolDesc] = useState('');

  // Marks Management state
  const [selectedStudentForMarks, setSelectedStudentForMarks] = useState<string>(allStudents[0]?.uid || 'std_001');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.code || 'BS-M201');
  const [cia1Input, setCia1Input] = useState<number>(18);
  const [cia2Input, setCia2Input] = useState<number>(19);
  const [cia3Input, setCia3Input] = useState<number>(20);
  const [semExamInput, setSemExamInput] = useState<number>(62);
  const [theoryHeldInput, setTheoryHeldInput] = useState<number>(45);
  const [theoryPresentInput, setTheoryPresentInput] = useState<number>(41);

  // Modal & Confirmation States
  const [studentToDelete, setStudentToDelete] = useState<UserProfile | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionLabel: 'Confirm',
    onConfirm: async () => {},
  });

  // Diagnostic State
  const [isVerifyingDb, setIsVerifyingDb] = useState(false);

  const handleVerifyLocalDb = async () => {
    playPop();
    setIsVerifyingDb(true);
    try {
      const result = await verifyDatabaseHealth();
      if (result.success) {
        playSuccess();
        addToast(
          `MongoDB verified! ${Object.keys(result.storeCounts).length} collections online | ${result.totalRecords} total records`,
          'success'
        );
      } else {
        addToast(`MongoDB error: ${result.error || 'Read failed'}`, 'error');
      }
    } catch (err: any) {
      addToast(`Diagnostic Error: ${err?.message || 'Verification exception'}`, 'error');
    } finally {
      setIsVerifyingDb(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  };

  // Security Guard for non-admin users
  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs my-6 space-y-3">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Admin Access Restricted</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          The Admin Control Center is restricted to Faculty Administrators and HOD. Standard student accounts can edit their individual profile details under the Profile section.
        </p>
      </div>
    );
  }

  // --- STUDENT HANDLERS ---
  const handleOpenEditStudent = (std: UserProfile) => {
    playPop();
    setEditingStudent(std);
    setEditName(std.name);
    setEditEmail(std.email);
    setEditPhone(std.phone || '');
    setEditBlood(std.bloodGroup);
    setEditRoll(std.rollNumber);
    setEditReg(std.regNumber);
    setEditSection(std.section);
    setEditPhoto(std.photoURL || '');
    setEditDataAccess(std.dataAccess || 'Full Read & Write');
  };

  const handleToggleStudentDataAccess = async (std: UserProfile, newLevel: 'Full Read & Write' | 'Read Only' | 'Restricted') => {
    playPop();
    const updated: UserProfile = { ...std, dataAccess: newLevel };
    await updateUserProfile(updated);
    playSuccess();
    addToast(`Data Access for ${std.name} updated to "${newLevel}"!`, 'success');
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const updated: UserProfile = {
      ...editingStudent,
      name: editName,
      email: editEmail,
      phone: editPhone,
      bloodGroup: editBlood,
      rollNumber: editRoll,
      regNumber: editReg,
      section: editSection,
      photoURL: editPhoto,
      dataAccess: editDataAccess,
    };

    await updateUserProfile(updated);
    playSuccess();
    setEditingStudent(null);
    addToast(`Successfully updated student record for ${updated.name}!`, 'success');
  };

  const handleDeleteStudent = (std: UserProfile) => {
    playPop();
    setStudentToDelete(std);
  };

  const handleConfirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    const stdName = studentToDelete.name;
    const uid = studentToDelete.uid;
    setStudentToDelete(null);
    await deleteStudent(uid);
    playSuccess();
    addToast(`Permanently deleted student record for ${stdName}.`, 'info');
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStdName.trim() || !newStdEmail.trim()) return;

    const newStudent: UserProfile = {
      uid: `std_${Date.now()}`,
      email: newStdEmail.trim(),
      name: newStdName.trim(),
      role: 'student',
      rollNumber: newStdRoll.trim(),
      regNumber: newStdReg.trim(),
      univRollNumber: '',
      department: 'Computer Science & Engineering',
      semester: '2nd Semester',
      section: newStdSection.trim() || 'CSE A',
      phone: newStdPhone.trim(),
      bloodGroup: newStdBlood.trim(),
      photoURL: newStdPhoto.trim() || '/avatars/profile_fallback.svg',
      academicYear: '',
      dataAccess: newStdDataAccess,
    };

    await addStudent(newStudent);
    playSuccess();
    setIsAddStudentOpen(false);
    setNewStdName('');
    setNewStdEmail('');
    setNewStdRoll('');
    setNewStdReg('');
    addToast(`Successfully added student ${newStudent.name} to directory!`, 'success');
  };

  // --- MARKS HANDLER ---
  const handleSaveStudentMarksAndAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudent = allStudents.find((s) => s.uid === selectedStudentForMarks);
    if (!targetStudent) return;
    const selectedSubject = subjects.find((subject) => subject.code === selectedSubjectId);
    const subjectSemester = Number(selectedSubject?.semester ?? 2);

    try {
      const existingMarks = marks.find(
        (m) => m.studentId === targetStudent.uid && m.subjectCode === selectedSubjectId && Number(m.semester ?? 2) === subjectSemester
      );

      const updatedMarksRecord: MarksRecord = {
        id: existingMarks?.id || `m_${targetStudent.uid}_s${subjectSemester}_${selectedSubjectId}`,
        studentId: targetStudent.uid,
        subjectCode: selectedSubjectId,
        subjectName: selectedSubject?.name || 'Subject',
        semester: subjectSemester,
        cia1: Number(cia1Input),
        cia2: Number(cia2Input),
        cia3: Number(cia3Input),
        pcia1: 18,
        pcia2: 19,
        semExam: Number(semExamInput),
        totalMax: 100,
      };

      const validatedMarks = marksRecordSchema.parse(updatedMarksRecord) as MarksRecord;
      await updateMarks(validatedMarks);

      const existingAtt = attendance.find(
        (a) => a.studentId === targetStudent.uid && a.subjectCode === selectedSubjectId && attendanceSemester(a) === subjectSemester
      );

      const updatedAttRecord: AttendanceRecord = {
        id: existingAtt?.id || `att_${targetStudent.uid}_s${subjectSemester}_${selectedSubjectId}`,
        studentId: targetStudent.uid,
        subjectCode: selectedSubjectId,
        subjectName: selectedSubject?.name || 'Subject',
        theoryHeld: Number(theoryHeldInput),
        theoryPresent: Number(theoryPresentInput),
        labHeld: existingAtt?.labHeld ?? 0,
        labPresent: existingAtt?.labPresent ?? 0,
        semester: subjectSemester,
      };

      const validatedAtt = attendanceRecordSchema.parse(updatedAttRecord) as AttendanceRecord;
      await updateAttendance(validatedAtt);

      playSuccess();
      addToast(`Updated Marks & Attendance for ${targetStudent.name} (${selectedSubjectId})!`, 'success');
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors)) {
        addToast(`Validation Error: ${err.errors[0]?.message}`, 'error');
      } else {
        addToast(`Error: ${err.message || 'Validation failed'}`, 'error');
      }
    }
  };

  // --- EXAM & EVENT CRUD HANDLERS ---
  const handleStartEditExam = (ev: CalendarEvent) => {
    playPop();
    setEditingExam(ev);
    setExamTitle(ev.title);
    setExamCategory(ev.category as any);
    setExamDate(ev.date);
    setExamEndDate(ev.endDate || ev.date);
    setExamDesc(ev.description || '');
  };

  const handleCancelEditExam = () => {
    playClick();
    setEditingExam(null);
    setExamTitle('');
    setExamDesc('');
  };

  const handleAddOrUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) return;

    if (editingExam) {
      const updated: CalendarEvent = {
        ...editingExam,
        title: examTitle.trim(),
        category: examCategory,
        date: examDate,
        endDate: examEndDate || examDate,
        description: examDesc || 'Official institutional schedule entry.',
      };
      await updateCalendarEvent(updated);
      playSuccess();
      setEditingExam(null);
      addToast(`Updated exam/event "${updated.title}"!`, 'success');
    } else {
      await addCalendarEvent({
        id: `ev_${Date.now()}`,
        title: examTitle.trim(),
        date: examDate,
        endDate: examEndDate || examDate,
        category: examCategory,
        description: examDesc || 'Official institutional schedule entry.',
      });
      playSuccess();
      addToast(`Exam/Event "${examTitle}" pushed to global schedule!`, 'success');
    }

    setExamTitle('');
    setExamDesc('');
  };

  const handleDeleteExam = async (id: string) => {
    await deleteCalendarEvent(id);
    playPop();
    addToast('Exam/Event removed from schedule.', 'info');
  };

  const handleClearAllExams = () => {
    playPop();
    setConfirmDialog({
      isOpen: true,
      title: 'Clear All Exam Schedules',
      message: 'Are you sure you want to clear ALL exams and institutional events from the schedule?',
      actionLabel: 'Clear All Exams',
      onConfirm: async () => {
        await clearAllCalendarEvents();
        playSuccess();
        addToast('All exams and events cleared from database.', 'info');
      },
    });
  };

  // --- HOLIDAY CRUD HANDLERS ---
  const handleStartEditHoliday = (hol: Holiday) => {
    playPop();
    setEditingHoliday(hol);
    setHolTitle(hol.title);
    setHolDate(hol.date);
    setHolCategory(hol.category as any);
    setHolDesc(hol.description || '');
  };

  const handleCancelEditHoliday = () => {
    playClick();
    setEditingHoliday(null);
    setHolTitle('');
    setHolDesc('');
  };

  const handleAddOrUpdateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holTitle.trim()) return;

    if (editingHoliday) {
      const updated: Holiday = {
        ...editingHoliday,
        title: holTitle.trim(),
        date: holDate,
        category: holCategory,
        description: holDesc || 'Official institute holiday update.',
      };
      await updateHoliday(updated);
      playSuccess();
      setEditingHoliday(null);
      addToast(`Updated holiday "${updated.title}"!`, 'success');
    } else {
      await addHoliday({
        id: `hol_${Date.now()}`,
        title: holTitle.trim(),
        date: holDate,
        category: holCategory,
        description: holDesc || 'Official institute holiday update.',
        isImportant: true,
      });
      playSuccess();
      addToast(`Holiday "${holTitle}" added to Academic Calendar!`, 'success');
    }

    setHolTitle('');
    setHolDesc('');
  };

  const handleDeleteHoliday = async (id: string) => {
    await deleteHoliday(id);
    playPop();
    addToast('Holiday removed from calendar.', 'info');
  };

  const handleClearAllHolidays = () => {
    playPop();
    setConfirmDialog({
      isOpen: true,
      title: 'Clear All Holidays',
      message: 'Are you sure you want to clear ALL official institute holidays?',
      actionLabel: 'Clear All Holidays',
      onConfirm: async () => {
        await clearAllHolidays();
        playSuccess();
        addToast('All holidays cleared from database.', 'info');
      },
    });
  };

  // --- CLEANUP HANDLERS ---
  const handleMassDeleteAcademicData = () => {
    playPop();
    setConfirmDialog({
      isOpen: true,
      title: 'Mass Delete Academic Data',
      message:
        'SECURITY CONFIRMATION: Are you sure you want to mass delete ALL documents in subjects, timetable, and events collections across ALL semesters? All student data stores will be initialized to an empty state.',
      actionLabel: 'Trigger Mass Delete',
      onConfirm: async () => {
        await massDeleteAcademicData();
        playSuccess();
        addToast('Mass delete completed across all semesters.', 'info');
      },
    });
  };

  const handleResetAttendanceRegisters = () => {
    playPop();
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Attendance Registers',
      message: 'Are you sure you want to reset ALL attendance registers to 0?',
      actionLabel: 'Reset All Attendance',
      onConfirm: async () => {
        await resetAllAttendance();
        playSuccess();
        addToast('All student attendance registers reset to 0.', 'info');
      },
    });
  };

  const handleFullDatabaseReset = () => {
    playPop();
    setConfirmDialog({
      isOpen: true,
      title: 'Full System & Database Factory Reset',
      message: 'Are you sure you want to perform a complete database reset to initial state?',
      actionLabel: 'Perform Complete Reset',
      onConfirm: async () => {
        await resetToDefaultData();
        playSuccess();
        addToast('Database restored to initial pristine state.', 'info');
      },
    });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-6 w-full min-w-0 pb-12"
    >
      {/* Header Banner */}
      <motion.div
        variants={cardVariants}
        className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-500" /> Faculty Administrative Operations
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            HOD & Admin Control Panel
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time synchronization across all student profiles for Exams, Holidays, Directory & Database Cleanup.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleVerifyLocalDb}
            disabled={isVerifyingDb}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            title="Verify MongoDB connection and report collection record counts"
          >
            <Database className={`w-4 h-4 ${isVerifyingDb ? 'animate-spin' : ''}`} />
            <span>{isVerifyingDb ? 'Verifying...' : 'Verify MongoDB'}</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            <div className="text-xs">
              <div className="font-bold text-slate-900 dark:text-white">{user?.name}</div>
              <div className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-mono">Role: HOD / Admin</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary Status Cards: Data Access Permission Metrics */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Full Read & Write */}
        <div className="p-4 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Full Read & Write
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-2">
              <span>{fullAccessCount}</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ({Math.round((fullAccessCount / Math.max(allStudents.length, 1)) * 100)}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Granted edit & update rights
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Unlock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Read Only Access */}
        <div className="p-4 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Read Only Access
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {readOnlyCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Profile editing restricted
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Restricted Access */}
        <div className="p-4 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Restricted Access
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {restrictedCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Locked admin oversight
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Student Cohort */}
        <div className="p-4 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Enrolled Cohort
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {allStudents.length}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Total active CSE A students
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        variants={cardVariants}
        className="flex bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-md p-1.5 rounded-2xl gap-1 overflow-x-auto"
      >
        <button
          onClick={() => {
            playClick();
            setActiveTab('Students');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'Students'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Users className="w-4 h-4" /> Student Directory ({allStudents.length})
        </button>

        <button
          onClick={() => {
            playClick();
            setActiveTab('Academic Calendar');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'Academic Calendar'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-400" /> Academic Calendar Settings
        </button>

        <button
          onClick={() => {
            playClick();
            setActiveTab('Marks');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'Marks'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Award className="w-4 h-4" /> Marks & Attendance
        </button>

        <button
          onClick={() => {
            playClick();
            setActiveTab('Exams');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'Exams'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Calendar className="w-4 h-4" /> Exam & Event CRUD ({calendarEvents.length})
        </button>

        <button
          onClick={() => {
            playClick();
            setActiveTab('Holidays');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'Holidays'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Palmtree className="w-4 h-4" /> Holidays ({holidays.length})
        </button>

        <button
          onClick={() => {
            playClick();
            setActiveTab('Cleanup');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'Cleanup'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Database Cleanup
        </button>
      </motion.div>

      {/* TAB 1: STUDENT DIRECTORY & EDITING */}
      {activeTab === 'Students' && (
        <motion.div
          variants={cardVariants}
          className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">CSE A Student Cohort Directory</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                View, edit, or delete student profiles. Real-time changes sync instantly across all student accounts.
              </p>
            </div>

            <button
              onClick={() => {
                playPop();
                setIsAddStudentOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add New Student
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold">
                  <th className="p-3 border border-slate-200/60 dark:border-slate-700/60">Student Name</th>
                  <th className="p-3 border border-slate-200/60 dark:border-slate-700/60">Roll Number</th>
                  <th className="p-3 border border-slate-200/60 dark:border-slate-700/60">Reg Number</th>
                  <th className="p-3 border border-slate-200/60 dark:border-slate-700/60">Email</th>
                  <th className="p-3 border border-slate-200/60 dark:border-slate-700/60">Phone</th>
                  <th className="p-3 border border-slate-200/60 dark:border-slate-700/60">Data Access Feature</th>
                  <th className="p-3 border border-slate-200/60 dark:border-slate-700/60 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allStudents.map((std) => (
                  <tr
                    key={std.uid}
                    className="border-b border-slate-200/40 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                  >
                    <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ProfileAvatar src={std.photoURL} userId={std.uid} alt={std.name} className="w-7 h-7 rounded-full shrink-0" />
                      <div>
                        <div>{std.name}</div>
                        <div className="text-[10px] font-normal text-slate-400">{std.bloodGroup} • Sec {std.section}</div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-blue-600 dark:text-blue-400 font-bold">{std.rollNumber}</td>
                    <td className="p-3 font-mono text-slate-500">{std.regNumber}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{std.email}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">{std.phone}</td>
                    <td className="p-3">
                      <select
                        value={std.dataAccess || 'Full Read & Write'}
                        onChange={(e) => handleToggleStudentDataAccess(std, e.target.value as any)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer transition ${
                          (std.dataAccess || 'Full Read & Write') === 'Full Read & Write'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                            : (std.dataAccess || 'Full Read & Write') === 'Read Only'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20'
                        }`}
                      >
                        <option value="Full Read & Write" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          🔓 Full Read & Write
                        </option>
                        <option value="Read Only" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          👁️ Read Only
                        </option>
                        <option value="Restricted" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          ⛔ Restricted
                        </option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditStudent(std)}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 transition"
                        >
                          <Edit2 className="w-3 h-3" /> Edit Student
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(std)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1 transition"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* TAB: ACADEMIC CALENDAR MANAGEMENT */}
      {activeTab === 'Academic Calendar' && (
        <AcademicCalendarManagementPage />
      )}

      {/* TAB 2: MARKS & ATTENDANCE MANAGEMENT */}
      {activeTab === 'Marks' && (
        <motion.div
          variants={cardVariants}
          className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4 max-w-2xl"
        >
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Student Marks & Attendance Portal</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a student and subject code to publish official CIA assessment marks and attendance counts.
            </p>
          </div>

          <form onSubmit={handleSaveStudentMarksAndAttendance} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Student</label>
                <select
                  value={selectedStudentForMarks}
                  onChange={(e) => setSelectedStudentForMarks(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                >
                  {allStudents.map((s) => (
                    <option key={s.uid} value={s.uid}>
                      {s.name} ({s.rollNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Subject Code</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                >
                  {subjects.length > 0 ? (
                    subjects.map((sub) => (
                      <option key={sub.code} value={sub.code}>
                        Sem {sub.semester ?? 2} · {sub.code} - {sub.name}
                      </option>
                    ))
                  ) : (
                    <option value="BS-M201">BS-M201 - Mathematics II</option>
                  )}
                </select>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">Continuous Internal Assessment (CIA) Marks</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-[11px] text-slate-600 dark:text-slate-400">CIA 1 (Max 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={cia1Input}
                    onChange={(e) => setCia1Input(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[11px] text-slate-600 dark:text-slate-400">CIA 2 (Max 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={cia2Input}
                    onChange={(e) => setCia2Input(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[11px] text-slate-600 dark:text-slate-400">CIA 3 (Max 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={cia3Input}
                    onChange={(e) => setCia3Input(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[11px] text-slate-600 dark:text-slate-400">Sem Exam (Max 70)</label>
                  <input
                    type="number"
                    min="0"
                    max="70"
                    value={semExamInput}
                    onChange={(e) => setSemExamInput(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">Theory Attendance Register</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-[11px] text-slate-600 dark:text-slate-400">Theory Held</label>
                  <input
                    type="number"
                    min="0"
                    value={theoryHeldInput}
                    onChange={(e) => setTheoryHeldInput(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[11px] text-slate-600 dark:text-slate-400">Theory Present</label>
                  <input
                    type="number"
                    min="0"
                    value={theoryPresentInput}
                    onChange={(e) => setTheoryPresentInput(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-md shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Marks & Attendance to Student Portal
            </button>
          </form>
        </motion.div>
      )}

      {/* TAB 3: EXAM & EVENT CRUD */}
      {activeTab === 'Exams' && (
        <div className="space-y-6">
          <motion.div
            variants={cardVariants}
            className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingExam ? `Edit Exam / Event: ${editingExam.title}` : 'Push New Exam / Institutional Event'}
              </h3>
              {editingExam && (
                <button
                  type="button"
                  onClick={handleCancelEditExam}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-xs transition"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleAddOrUpdateExam} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Title / Exam Name</label>
                <input
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="e.g. CIA 1 Internal Test (Semester 2)"
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={examCategory}
                  onChange={(e: any) => setExamCategory(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
                >
                  <option value="Exam">Exam / Internal Test</option>
                  <option value="Academic">Academic Schedule</option>
                  <option value="Event">Institutional Event</option>
                  <option value="Registration">Registration Deadline</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  value={examEndDate}
                  onChange={(e) => setExamEndDate(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description / Guidelines</label>
                <input
                  type="text"
                  value={examDesc}
                  onChange={(e) => setExamDesc(e.target.value)}
                  placeholder="e.g. Covers Modules 1 & 2 for all B.Tech CSE sections."
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-md shadow-purple-500/20 flex items-center justify-center gap-2"
                >
                  {editingExam ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingExam ? 'Save Changes to Exam Schedule' : 'Push Event to Global Student Calendar'}</span>
                </button>
              </div>
            </form>
          </motion.div>

          <motion.div
            variants={cardVariants}
            className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Current Exams & Calendar Schedule</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage, edit, or delete individual schedule entries.
                </p>
              </div>
              {calendarEvents.length > 0 && (
                <button
                  onClick={handleClearAllExams}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-600/20 transition"
                >
                  Clear All Exams
                </button>
              )}
            </div>

            {calendarEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                No active exam dates recorded in database. (The CIA Countdown will remain hidden or display N/A).
              </div>
            ) : (
              <div className="space-y-2">
                {calendarEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{ev.title}</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono text-[10px]">
                          {ev.category}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        📅 {ev.date} {ev.endDate && ev.endDate !== ev.date ? `to ${ev.endDate}` : ''} • {ev.description}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={() => handleStartEditExam(ev)}
                        className="p-1.5 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-400 transition"
                        title="Edit Exam"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExam(ev.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* TAB 4: HOLIDAYS CRUD */}
      {activeTab === 'Holidays' && (
        <div className="space-y-6">
          <motion.div
            variants={cardVariants}
            className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4 max-w-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingHoliday ? `Edit Holiday: ${editingHoliday.title}` : 'Add New Official Holiday'}
              </h3>
              {editingHoliday && (
                <button
                  type="button"
                  onClick={handleCancelEditHoliday}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-xs transition"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleAddOrUpdateHoliday} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Holiday Title</label>
                <input
                  type="text"
                  required
                  value={holTitle}
                  onChange={(e) => setHolTitle(e.target.value)}
                  placeholder="e.g. Independence Day"
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  required
                  value={holDate}
                  onChange={(e) => setHolDate(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={holCategory}
                  onChange={(e: any) => setHolCategory(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
                >
                  <option value="Festival">Festival</option>
                  <option value="National">National Holiday</option>
                  <option value="College">College Holiday</option>
                  <option value="Vacation">Vacation</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={holDesc}
                  onChange={(e) => setHolDesc(e.target.value)}
                  placeholder="e.g. National holiday observance across campus."
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-md shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                {editingHoliday ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{editingHoliday ? 'Save Holiday Changes' : 'Add Holiday to Calendar'}</span>
              </button>
            </form>
          </motion.div>

          <motion.div
            variants={cardVariants}
            className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Current Holidays</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage, edit, or remove official institute holidays.
                </p>
              </div>

              {holidays.length > 0 && (
                <button
                  onClick={handleClearAllHolidays}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-600/20 transition"
                >
                  Clear All Holidays
                </button>
              )}
            </div>

            {holidays.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                No holidays recorded in database.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {holidays.map((hol) => (
                  <div
                    key={hol.id}
                    className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                        {hol.category}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">{hol.date}</span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{hol.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{hol.description}</p>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <button
                        onClick={() => handleStartEditHoliday(hol)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-400 font-bold text-[11px] flex items-center gap-1 transition"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(hol.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-[11px] flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* TAB 5: DATABASE CLEANUP & RESET UTILITIES */}
      {activeTab === 'Cleanup' && (
        <motion.div
          variants={cardVariants}
          className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-5 max-w-2xl"
        >
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Database Cleanup & Reset Utilities</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Administrative tools for clearing or resetting persistent MongoDB records.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-slate-800 dark:text-slate-200 space-y-2">
              <div className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Mass Delete Subjects, Timetable & Events (All Semesters)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Permanently deletes subjects, timetable slots, and calendar events across all semesters from MongoDB.
              </p>
              <button
                onClick={handleMassDeleteAcademicData}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-xs"
              >
                Trigger Mass Delete (Subjects, Timetable & Events)
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-200 space-y-2">
              <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Clear All Exams & Calendar Events
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Wipes all recorded exam schedules. This will automatically hide the CIA Countdown card on the student dashboard until new dates are pushed.
              </p>
              <button
                onClick={handleClearAllExams}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-xs"
              >
                Clear All Exam Schedules
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-slate-800 dark:text-slate-200 space-y-2">
              <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Palmtree className="w-4 h-4" /> Clear All Official Holidays
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Wipes all recorded holiday dates from the academic calendar.
              </p>
              <button
                onClick={handleClearAllHolidays}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs"
              >
                Clear All Holidays
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-slate-800 dark:text-slate-200 space-y-2">
              <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Reset Attendance Registers
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Resets all student attendance counts to zero for a new semester start.
              </p>
              <button
                onClick={handleResetAttendanceRegisters}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-xs"
              >
                Reset All Student Attendance to 0
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-slate-800 dark:text-slate-200 space-y-2">
              <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Full System & Database Factory Reset
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Restores the entire StudentOS ecosystem to initial clean default dataset.
              </p>
              <button
                onClick={handleFullDatabaseReset}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-xs"
              >
                Perform Complete Database Reset
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Admin Edit Student Glass Modal */}
      <GlassModal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title={`Admin Edit: ${editingStudent?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Student Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Institute Email Address</label>
            <input
              type="email"
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Roll Number</label>
              <input
                type="text"
                required
                value={editRoll}
                onChange={(e) => setEditRoll(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reg Number</label>
              <input
                type="text"
                required
                value={editReg}
                onChange={(e) => setEditReg(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
              <input
                type="text"
                required
                value={editBlood}
                onChange={(e) => setEditBlood(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Photo Image URL</label>
            <input
              type="url"
              value={editPhoto}
              onChange={(e) => setEditPhoto(e.target.value)}
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Data Access Permission Level</span>
              <span className="text-[10px] font-normal text-slate-400">Admin Control</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { level: 'Full Read & Write', label: 'Full Read & Write', icon: '🔓', desc: 'Can update profile & records' },
                { level: 'Read Only', label: 'Read Only', icon: '👁️', desc: 'Can view records, no edits' },
                { level: 'Restricted', label: 'Restricted', icon: '⛔', desc: 'Limited profile capabilities' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.level}
                  onClick={() => setEditDataAccess(item.level as any)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    editDataAccess === item.level
                      ? item.level === 'Full Read & Write'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                        : item.level === 'Read Only'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/30'
                        : 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/30'
                      : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                  }`}
                >
                  <div className="font-bold text-[11px] flex items-center gap-1">
                    <span>{item.icon}</span> <span>{item.label}</span>
                  </div>
                  <div className="text-[9px] opacity-75 mt-1">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setEditingStudent(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-md shadow-purple-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Student Record
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Admin Add New Student Glass Modal */}
      <GlassModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title="Enroll New Student"
        maxWidth="md"
      >
        <form onSubmit={handleAddStudentSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newStdName}
              onChange={(e) => setNewStdName(e.target.value)}
              placeholder="e.g. Student"
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Institute Email</label>
            <input
              type="email"
              required
              value={newStdEmail}
              onChange={(e) => setNewStdEmail(e.target.value)}
              placeholder="e.g. student@example.com"
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Roll Number</label>
              <input
                type="text"
                required
                value={newStdRoll}
                onChange={(e) => setNewStdRoll(e.target.value)}
                placeholder="e.g. STUDENT-001"
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Registration No.</label>
              <input
                type="text"
                required
                value={newStdReg}
                onChange={(e) => setNewStdReg(e.target.value)}
                placeholder="e.g. REG-001"
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={newStdPhone}
                onChange={(e) => setNewStdPhone(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
              <input
                type="text"
                required
                value={newStdBlood}
                onChange={(e) => setNewStdBlood(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Photo Image URL</label>
            <input
              type="url"
              value={newStdPhoto}
              onChange={(e) => setNewStdPhoto(e.target.value)}
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Data Access Permission Level</span>
              <span className="text-[10px] font-normal text-slate-400">Default: Full Read & Write</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { level: 'Full Read & Write', label: 'Full Read & Write', icon: '🔓', desc: 'Can update profile & records' },
                { level: 'Read Only', label: 'Read Only', icon: '👁️', desc: 'Can view records, no edits' },
                { level: 'Restricted', label: 'Restricted', icon: '⛔', desc: 'Limited profile capabilities' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.level}
                  onClick={() => setNewStdDataAccess(item.level as any)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    newStdDataAccess === item.level
                      ? item.level === 'Full Read & Write'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                        : item.level === 'Read Only'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/30'
                        : 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/30'
                      : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                  }`}
                >
                  <div className="font-bold text-[11px] flex items-center gap-1">
                    <span>{item.icon}</span> <span>{item.label}</span>
                  </div>
                  <div className="text-[9px] opacity-75 mt-1">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setIsAddStudentOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-md shadow-purple-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Student Record
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Delete Student Confirmation Modal */}
      <GlassModal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        title="Delete Student Profile?"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 rounded-2xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Permanent Record Deletion</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to permanently delete student <span className="font-bold text-slate-900 dark:text-white">{studentToDelete?.name}</span> ({studentToDelete?.rollNumber})? This will remove their record from the CSE A cohort directory and cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setStudentToDelete(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteStudent}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Permanently Delete Student
            </button>
          </div>
        </div>
      </GlassModal>

      {/* Generic Admin Action Confirmation Modal */}
      <GlassModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        title={confirmDialog.title}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 rounded-2xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Admin Action Confirmation</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {confirmDialog.message}
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                const action = confirmDialog.onConfirm;
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                await action();
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition"
            >
              {confirmDialog.actionLabel}
            </button>
          </div>
        </div>
      </GlassModal>
    </motion.div>
  );
};
