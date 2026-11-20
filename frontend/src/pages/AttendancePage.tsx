import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Sparkles,
  Calculator,
  Download,
  FileSpreadsheet,
  FileText,
  Trash2,
  Search,
  Filter,
  Calendar,
  X,
  BookOpen,
  FlaskConical,
  RefreshCw,
  Check,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useSchedule } from '../hooks/useSchedule';
import { AttendanceRecord, AttendanceLedgerEntry } from '../types';
import { useSound } from '../hooks/useSound';
import { useToast } from '../context/ToastContext';
import { GlassModal } from '../components/common/GlassModal';
import { calendarClosureStatus, isCountingAttendanceStatus, type NonCountingAttendanceStatus } from '../utils/attendanceClosures';
import { localDateKey } from '../utils/calendarActivity';
import {
  MIN_SUBJECT_ATTENDANCE_PERCENT,
  attendanceSemester,
  getAttendancePlan,
  getSubjectAttendance,
} from '../utils/attendanceThreshold';
import {
  exportAttendancePDF,
  exportAttendanceExcel,
  exportAttendanceCSV,
} from '../utils/exportAttendance';

export const isLabSubject = (code: string, name: string): boolean => {
  const s = (name || '').toLowerCase();
  const c = (code || '').toLowerCase();
  return (
    s.includes('lab') ||
    s.includes('laboratory') ||
    s.includes('workshop') ||
    s.includes('practical') ||
    c.includes('291') ||
    c.includes('292')
  );
};

export const AttendancePage: React.FC = () => {
  const { playClick, playSuccess, playDelete } = useSound();
  const { showToast } = useToast();

  const {
    attendance,
    attendanceLedger,
    updateAttendance,
    resetSubjectAttendance,
    resetAllAttendance,
    addAttendanceLedgerEntry,
    deleteAttendanceLedgerEntry,
    user,
    allStudents,
    subjects,
    calendarEvents,
    holidays,
    currentDate,
  } = useAppStore();

  const { activeSemester, setActiveSemester } = useSchedule();

  const [selectedTab, setSelectedTab] = useState<'All' | 'Theory' | 'Lab'>('All');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(allStudents[0]?.uid || 'std_001');

  // Reset Modals State
  const [subjectToReset, setSubjectToReset] = useState<AttendanceRecord | null>(null);
  const [showResetAllModal, setShowResetAllModal] = useState<boolean>(false);

  // Ledger Add Modal State
  const [showAddLedgerModal, setShowAddLedgerModal] = useState<boolean>(false);
  const [newLedgerSubjectCode, setNewLedgerSubjectCode] = useState<string>('');
  const [newLedgerDate, setNewLedgerDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [newLedgerStatus, setNewLedgerStatus] = useState<'Present' | 'Absent' | NonCountingAttendanceStatus>('Present');
  const [newLedgerRemarks, setNewLedgerRemarks] = useState<string>('');

  // Ledger Table Filters
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<string>('All');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<string>('All');

  const isAdmin = user?.role === 'admin';
  const inspectedStudent = isAdmin
    ? allStudents.find((s) => s.uid === selectedStudentId) || allStudents[0]
    : user;

  const currentStudentId = inspectedStudent?.uid || 'std_001';

  // Filter subjects for active semester
  const semesterSubjects = subjects.filter((s) => Number(s.semester || 2) === Number(activeSemester));

  // Filter attendance records for inspected student & active semester
  const studentAtt = attendance.filter(
    (a) => a.studentId === currentStudentId && attendanceSemester(a) === Number(activeSemester)
  );

  // Guarantee that ALL semester enrolled subjects appear in displayAttendance
  const displayAttendance = semesterSubjects.map((sub) => {
    const existing = studentAtt.find(
      (a) => a.subjectCode === sub.code || a.subjectName.toLowerCase() === sub.name.toLowerCase()
    );
    if (existing) {
      return { ...existing, semester: Number(sub.semester || activeSemester) };
    }
    return {
      id: `att_${currentStudentId}_s${activeSemester}_${sub.code.replace(/[^a-zA-Z0-9]/g, '_')}`,
      studentId: currentStudentId,
      subjectCode: sub.code,
      subjectName: sub.name,
      theoryHeld: 0,
      theoryPresent: 0,
      labHeld: 0,
      labPresent: 0,
      semester: Number(sub.semester || activeSemester),
      lastUpdated: new Date().toISOString().substring(0, 10),
    } as AttendanceRecord;
  });

  // Filter attendance ledger entries for inspected student & active semester
  const studentLedger = attendanceLedger.filter(
    (l) => l.studentId === currentStudentId && Number(l.semester ?? 2) === Number(activeSemester)
  );

  // Tab Filtering for Cards Grid
  const filteredCards = displayAttendance.filter((rec) => {
    const isLab = isLabSubject(rec.subjectCode, rec.subjectName);
    if (selectedTab === 'Theory') return !isLab;
    if (selectedTab === 'Lab') return isLab;
    return true;
  });

  // Calculate Overall Attendance Health
  const totalHeld = displayAttendance.reduce((acc, a) => acc + getSubjectAttendance(a).held, 0);
  const totalPresent = displayAttendance.reduce((acc, a) => acc + getSubjectAttendance(a).present, 0);
  const overallPct = totalHeld > 0 ? (totalPresent / totalHeld) * 100 : null;
  const lowAttendanceSubjects = displayAttendance.filter((record) => getSubjectAttendance(record).belowMinimum);

  // Handle a counting class log. Calendar closures are ledger-only and never change totals.
  const handleClassLogged = async (record: AttendanceRecord, isPresent: boolean) => {
    const closure = calendarClosureStatus(currentDate || localDateKey(), calendarEvents, holidays);
    if (closure) {
      showToast(`${closure} on ${currentDate}: attendance is not calculated.`, 'info');
      return;
    }
    const isLab = isLabSubject(record.subjectCode, record.subjectName);
    const now = new Date();
    const nowStr = `${currentDate || localDateKey()} ${now.toTimeString().slice(0, 5)}`;

    const updated: AttendanceRecord = {
      ...record,
      theoryHeld: !isLab ? record.theoryHeld + 1 : record.theoryHeld,
      theoryPresent: !isLab && isPresent ? record.theoryPresent + 1 : record.theoryPresent,
      labHeld: isLab ? record.labHeld + 1 : record.labHeld,
      labPresent: isLab && isPresent ? record.labPresent + 1 : record.labPresent,
      semester: activeSemester,
      lastUpdated: nowStr.substring(0, 10),
    };

    const ledgerEntry: AttendanceLedgerEntry = {
      id: `led_${Date.now()}`,
      studentId: currentStudentId,
      subjectCode: record.subjectCode,
      subjectName: record.subjectName,
      date: nowStr,
      sessionType: isLab ? 'Lab' : 'Theory',
      status: isPresent ? 'Present' : 'Absent',
      remarks: isPresent ? 'Class attended' : 'Class missed',
      semester: activeSemester,
    };

    try {
      await addAttendanceLedgerEntry(ledgerEntry);
      await updateAttendance(updated);
      playSuccess();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Attendance could not be saved.', 'error');
      return;
    }
    showToast(
      `${record.subjectCode}: Marked ${isPresent ? 'Present' : 'Absent'}`,
      isPresent ? 'success' : 'info'
    );
  };

  // Confirm Single Subject Reset
  const confirmResetSubject = async () => {
    if (!subjectToReset) return;
    playDelete();
    await resetSubjectAttendance(subjectToReset.subjectCode, currentStudentId, activeSemester);
    showToast(`Reset attendance for ${subjectToReset.subjectCode}`, 'info');
    setSubjectToReset(null);
  };

  // Confirm Reset All Subjects
  const confirmResetAll = async () => {
    playDelete();
    await resetAllAttendance(currentStudentId, activeSemester);
    showToast('Reset all subject attendance records', 'info');
    setShowResetAllModal(false);
  };

  // Submit Manual Ledger Entry
  const handleAddManualLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLedgerSubjectCode) return;

    const calendarStatus = calendarClosureStatus(newLedgerDate, calendarEvents, holidays);
    if (calendarStatus && isCountingAttendanceStatus(newLedgerStatus)) {
      showToast(`${calendarStatus} is recorded on this date. Choose ${calendarStatus} or do not add attendance.`, 'error');
      return;
    }
    const sub = semesterSubjects.find((s) => s.code === newLedgerSubjectCode);
    const code = sub ? sub.code : newLedgerSubjectCode;
    const name = sub ? sub.name : 'Selected Subject';
    const isLab = isLabSubject(code, name);
    const isPresent = newLedgerStatus === 'Present';
    const isCounting = isCountingAttendanceStatus(newLedgerStatus);

    // Find attendance record to update
    const record = displayAttendance.find((a) => a.subjectCode === code);
    let updated: AttendanceRecord | null = null;
    if (record) {
      updated = {
        ...record,
        theoryHeld: !isLab && isCounting ? record.theoryHeld + 1 : record.theoryHeld,
        theoryPresent: !isLab && isCounting && isPresent ? record.theoryPresent + 1 : record.theoryPresent,
        labHeld: isLab && isCounting ? record.labHeld + 1 : record.labHeld,
        labPresent: isLab && isCounting && isPresent ? record.labPresent + 1 : record.labPresent,
        semester: activeSemester,
        lastUpdated: newLedgerDate,
      };
    }

    const ledgerEntry: AttendanceLedgerEntry = {
      id: `led_manual_${Date.now()}`,
      studentId: currentStudentId,
      subjectCode: code,
      subjectName: name,
      date: `${newLedgerDate} 10:00`,
      sessionType: isLab ? 'Lab' : 'Theory',
      status: newLedgerStatus,
      remarks: newLedgerRemarks || (isCounting ? `Manual entry: ${newLedgerStatus}` : `No attendance calculated: ${newLedgerStatus}`),
      semester: activeSemester,
    };

    try {
      await addAttendanceLedgerEntry(ledgerEntry);
      if (isCounting && updated) await updateAttendance(updated);
      playSuccess();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Ledger entry could not be saved.', 'error');
      return;
    }
    showToast(isCounting ? 'Manual class entry added to ledger' : `${newLedgerStatus} class saved without affecting attendance`, 'success');
    setShowAddLedgerModal(false);
    setNewLedgerRemarks('');
  };

  // Filtered Ledger Entries for Table
  const filteredLedger = studentLedger.filter((entry) => {
    const matchesSearch =
      entry.subjectName.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      entry.subjectCode.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      entry.date.includes(ledgerSearch) ||
      (entry.remarks || '').toLowerCase().includes(ledgerSearch.toLowerCase());

    const matchesStatus = ledgerStatusFilter === 'All' || entry.status === ledgerStatusFilter;
    const matchesType = ledgerTypeFilter === 'All' || entry.sessionType === ledgerTypeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

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
      {/* Semester Switcher Bar */}
      <motion.div
        variants={cardVariants}
        className="flex flex-wrap items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs"
      >
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 whitespace-nowrap flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-500" /> Active Semester:
        </div>
        <div role="group" aria-label="Attendance semester" className="flex max-w-full flex-wrap items-center gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <button
              key={sem}
              type="button"
              aria-pressed={activeSemester === sem}
              onClick={() => {
                playClick();
                setActiveSemester(sem);
              }}
              className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                activeSemester === sem
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Sem {sem}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Admin Inspector Header Selector */}
      {isAdmin && (
        <motion.div
          variants={cardVariants}
          className="p-4 rounded-3xl bg-purple-900/20 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs backdrop-blur-md"
        >
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-bold">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Admin Operator Mode: Select Student to Inspect Attendance Tracker</span>
          </div>

          <select
            value={selectedStudentId}
            onChange={(e) => {
              playClick();
              setSelectedStudentId(e.target.value);
            }}
            className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {allStudents.map((std) => (
              <option key={std.uid} value={std.uid}>
                🎓 {std.name} ({std.rollNumber})
              </option>
            ))}
          </select>
        </motion.div>
      )}

      {/* Main Attendance Header */}
      <div
        data-attendance-header
        className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 text-white shadow-xl shadow-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6 isolate"
      >
        <div>
          <div className="text-xs font-bold text-emerald-200 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Attendance Tracker & Analytics
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            {isAdmin ? `Attendance Record: ${inspectedStudent?.name}` : 'Attendance Health Portal'}
          </h1>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-xl leading-relaxed">
            Semester {activeSemester} Subject Attendance • Minimum per subject: <strong className="text-white">{MIN_SUBJECT_ATTENDANCE_PERCENT}%</strong>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/20 shrink-0">
          <div className="text-center px-2">
            <div className="text-3xl md:text-4xl font-black tracking-tight">{overallPct === null ? 'N/A' : `${overallPct.toFixed(1)}%`}</div>
            <div className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider mt-0.5">Overall Health</div>
          </div>
          <div className="h-10 w-[1px] bg-white/20" />
          <div className="text-xs space-y-1 font-medium">
            <div className="flex justify-between gap-4">
              <span className="text-emerald-100">Held:</span>
              <strong className="font-bold">{totalHeld}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-emerald-100">Attended:</span>
              <strong className="font-bold text-white">{totalPresent}</strong>
            </div>
          </div>
        </div>
      </div>

      {lowAttendanceSubjects.length > 0 && (
        <motion.div
          variants={cardVariants}
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-900 shadow-xs dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 text-sm">
            <p className="font-bold">Semester {activeSemester}: subject attendance below {MIN_SUBJECT_ATTENDANCE_PERCENT}%</p>
            <p className="mt-1 text-xs leading-relaxed">
              {lowAttendanceSubjects.map((record) => {
                const percentage = getSubjectAttendance(record).percentage!;
                return `${record.subjectName} (${percentage.toFixed(1)}%)`;
              }).join(', ')}. Attend upcoming classes to reach the minimum in each subject.
            </p>
          </div>
        </motion.div>
      )}

      {/* Control Bar: Tabs & Actions */}
      <motion.div
        variants={cardVariants}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-3"
      >
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Theory', 'Lab'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                playClick();
                setSelectedTab(tab);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedTab === tab
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab === 'Theory' && <BookOpen className="w-3.5 h-3.5" />}
              {tab === 'Lab' && <FlaskConical className="w-3.5 h-3.5" />}
              {tab} Attendance
            </button>
          ))}
        </div>

        {/* Global Reset & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              playClick();
              setShowResetAllModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset All
          </button>

          <button
            onClick={() => {
              playClick();
              exportAttendancePDF({
                student: inspectedStudent || allStudents[0],
                attendanceRecords: displayAttendance,
                ledgerEntries: studentLedger,
                semester: activeSemester,
              });
              showToast('Exporting PDF Report...', 'info');
            }}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>

          <button
            onClick={async () => {
              playClick();
              try {
                await exportAttendanceExcel({
                  student: inspectedStudent || allStudents[0],
                  attendanceRecords: displayAttendance,
                  ledgerEntries: studentLedger,
                  semester: activeSemester,
                });
                showToast('Excel report downloaded.', 'success');
              } catch {
                showToast('Excel report could not be created. Try again.', 'error');
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>

          <button
            onClick={() => {
              playClick();
              exportAttendanceCSV({
                student: inspectedStudent || allStudents[0],
                attendanceRecords: displayAttendance,
                ledgerEntries: studentLedger,
                semester: activeSemester,
              });
              showToast('Exporting CSV File...', 'info');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold hover:bg-slate-200 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </motion.div>

      {/* Subject Attendance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCards.map((rec) => {
          const isLab = isLabSubject(rec.subjectCode, rec.subjectName);
          const sessionHeld = isLab ? rec.labHeld : rec.theoryHeld;
          const sessionPresent = isLab ? rec.labPresent : rec.theoryPresent;
          const subjectAttendance = getSubjectAttendance(rec);
          const prediction = getAttendancePlan(subjectAttendance.held, subjectAttendance.present);
          const isDanger = subjectAttendance.belowMinimum;

          return (
            <motion.div
              key={rec.id}
              variants={cardVariants}
              whileHover={{ y: -3 }}
              className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border transition-all duration-200 relative ${
                isDanger
                  ? 'border-rose-300 dark:border-rose-900/60 shadow-lg shadow-rose-500/5'
                  : 'border-slate-200/70 dark:border-slate-800/70 shadow-xs'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs">
                      {rec.subjectCode}
                    </span>

                    {/* Enforced Session Type Tag */}
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 ${
                        isLab
                          ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                          : 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300'
                      }`}
                    >
                      {isLab ? <FlaskConical className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                      {isLab ? 'Lab Session' : 'Theory Lecture'}
                    </span>

                    {isDanger && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px]">
                        Below {MIN_SUBJECT_ATTENDANCE_PERCENT}%
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base mt-2">
                    {rec.subjectName}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-2xl font-black tracking-tight ${
                      isDanger
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {subjectAttendance.percentage === null ? 'N/A' : `${subjectAttendance.percentage.toFixed(1)}%`}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Subject Attendance
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDanger ? 'bg-rose-500' : (subjectAttendance.percentage ?? 0) >= 85 ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, subjectAttendance.percentage ?? 0)}%` }}
                />
              </div>

              {/* Subject Specific Attendance Counters & Logging */}
              <div className="mt-4 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    {isLab ? 'Laboratory Classes' : 'Theory Lectures'}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                    {sessionPresent} / {sessionHeld} Attended{sessionHeld > 0 ? ` (${((sessionPresent / sessionHeld) * 100).toFixed(0)}%)` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleClassLogged(rec, true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm active:scale-95 flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Present
                  </button>
                  <button
                    onClick={() => handleClassLogged(rec, false)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm active:scale-95 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Absent
                  </button>
                </div>
              </div>

              {/* Footer Banner & Reset Button */}
              <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                <div className="p-2.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 text-[11px] flex items-center gap-1.5 flex-1">
                  <Calculator className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  {subjectAttendance.percentage === null ? (
                    <span className="text-slate-500 dark:text-slate-400">No classes recorded for this subject yet.</span>
                  ) : !isDanger ? (
                    <span className="text-slate-700 dark:text-slate-300">
                      At or above {MIN_SUBJECT_ATTENDANCE_PERCENT}%: Can miss <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{prediction.canMiss}</strong> more classes.
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      Below {MIN_SUBJECT_ATTENDANCE_PERCENT}%: Attend the next <strong className="underline font-bold">{prediction.needToAttend}</strong> consecutive classes.
                    </span>
                  )}
                </div>

                {/* Subject Reset Button */}
                <button
                  onClick={() => {
                    playClick();
                    setSubjectToReset(rec);
                  }}
                  title="Reset Subject Attendance Data"
                  className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition border border-slate-200 dark:border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* DETAILED ATTENDANCE LEDGER SECTION */}
      <motion.div
        variants={cardVariants}
        className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/70 dark:border-slate-800/70 shadow-xs space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
              Comprehensive Audit Trail
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" /> Attendance Ledger ({filteredLedger.length} Entries)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                playClick();
                setShowAddLedgerModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Log Manual Class Entry
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by subject, date or remarks..."
              value={ledgerSearch}
              onChange={(e) => setLedgerSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={ledgerStatusFilter}
              onChange={(e) => {
                playClick();
                setLedgerStatusFilter(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present Only</option>
              <option value="Absent">Absent Only</option>
              <option value="Off">OFF Classes</option>
              <option value="Event">Event / Exam Classes</option>
              <option value="Holiday">Holiday Classes</option>
              <option value="Reset">Reset Events</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={ledgerTypeFilter}
              onChange={(e) => {
                playClick();
                setLedgerTypeFilter(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value="All">All Session Types</option>
              <option value="Theory">Theory Lectures</option>
              <option value="Lab">Lab Sessions</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="scrollable-table-container custom-scrollbar border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold">
                <th className="p-3 border-b border-slate-200 dark:border-slate-700">Date & Time</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-700">Subject Code & Name</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-700">Session Type</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-700">Status</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-700">Remarks</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.length > 0 ? (
                filteredLedger.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="p-3 font-mono font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{entry.subjectName}</div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold">
                        {entry.subjectCode}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          entry.sessionType === 'Lab'
                            ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {entry.sessionType}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                          entry.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                            : entry.status === 'Absent'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200'
                            : entry.status === 'Off'
                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
                            : entry.status === 'Event'
                            ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200'
                            : entry.status === 'Holiday'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 italic text-[11px]">
                      {entry.remarks || 'Standard log entry'}
                    </td>
                    <td className="p-3 text-right">
                      {!entry.automaticClosure && <button
                        onClick={() => {
                          playDelete();
                          deleteAttendanceLedgerEntry(entry.id);
                          showToast('Deleted ledger entry', 'info');
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        title="Delete Ledger Log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    No matching attendance ledger records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* MODAL: RESET SINGLE SUBJECT ATTENDANCE */}
      <GlassModal
        isOpen={!!subjectToReset}
        onClose={() => setSubjectToReset(null)}
        title="Reset Attendance Data"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to reset attendance for{' '}
            <strong className="text-slate-900 dark:text-white">{subjectToReset?.subjectName}</strong> (
            {subjectToReset?.subjectCode})? This will set both present and absent counts to <strong>0</strong>.
          </p>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              onClick={() => setSubjectToReset(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={confirmResetSubject}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md"
            >
              Reset Subject
            </button>
          </div>
        </div>
      </GlassModal>

      {/* MODAL: RESET ALL ATTENDANCE */}
      <GlassModal
        isOpen={showResetAllModal}
        onClose={() => setShowResetAllModal(false)}
        title="Global Attendance Reset"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            You are about to reset <strong>ALL subject attendance records</strong> for{' '}
            <strong className="text-slate-900 dark:text-white">{inspectedStudent?.name}</strong> back to 0 held & 0 present.
          </p>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              onClick={() => setShowResetAllModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={confirmResetAll}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md"
            >
              Reset All Subjects
            </button>
          </div>
        </div>
      </GlassModal>

      {/* MODAL: ADD MANUAL LEDGER ENTRY */}
      <GlassModal
        isOpen={showAddLedgerModal}
        onClose={() => setShowAddLedgerModal(false)}
        title="Log Retroactive Class Entry"
      >
        <form onSubmit={handleAddManualLedger} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Select Subject</label>
            <select
              required
              value={newLedgerSubjectCode}
              onChange={(e) => setNewLedgerSubjectCode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Date</label>
              <input
                type="date"
                required
                value={newLedgerDate}
                onChange={(e) => setNewLedgerDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Attendance Status</label>
              <select
                value={newLedgerStatus}
                onChange={(e: any) => setNewLedgerStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Off">OFF — teacher did not take class</option>
                <option value="Event">Event / exam — no class held</option>
                <option value="Holiday">Holiday — no class held</option>
              </select>
            </div>
          </div>

          {calendarClosureStatus(newLedgerDate, calendarEvents, holidays) && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              Calendar shows {calendarClosureStatus(newLedgerDate, calendarEvents, holidays)} on this date. Present and Absent cannot be recorded.
            </p>
          )}

          <div>
            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Remarks / Note</label>
            <input
              type="text"
              placeholder="e.g. Attended guest lecture on Optics"
              value={newLedgerRemarks}
              onChange={(e) => setNewLedgerRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddLedgerModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
            >
              Add Ledger Record
            </button>
          </div>
        </form>
      </GlassModal>
    </motion.div>
  );
};
