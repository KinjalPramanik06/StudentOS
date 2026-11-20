import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Sparkles,
  User,
  ArrowRight,
  TrendingUp,
  Clock,
  Plus,
  X,
  Calendar,
  FlaskConical,
  BookOpen,
  Layers,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AcademicQuoteCard } from '../components/common/AcademicQuoteCard';
import { GlassModal } from '../components/common/GlassModal';
import { DashboardLoader } from '../components/common/DashboardLoader';
import { AcademicProgressTracker } from '../components/dashboard/AcademicProgressTracker';
import { useSchedule } from '../hooks/useSchedule';
import { useSound } from '../hooks/useSound';
import { useToast } from '../context/ToastContext';
import { formatClock12h, formatTimeSlot12h } from '../utils/formatTime';
import { MIN_SUBJECT_ATTENDANCE_PERCENT, attendanceSemester, getSubjectAttendance } from '../utils/attendanceThreshold';
import dayjs from 'dayjs';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export const DashboardPage: React.FC = () => {
  const {
    user,
    attendance,
    marks,
    semesterResults,
    timetable,
    holidays,
    calendarEvents,
    addCalendarEvent,
    deleteCalendarEvent,
    allStudents,
    subjects,
    academicCalendar,
  } = useAppStore();
  const navigate = useNavigate();
  const { playClick, playSuccess, playTab, playWarning } = useSound();
  const { showToast } = useToast();

  const { activeSemester, setActiveSemester, todaySlots, todayName } = useSchedule();

  const [showLoader, setShowLoader] = useState(() => {
    return sessionStorage.getItem('studentos_just_logged_in') === 'true';
  });

  const [currentTime, setCurrentTime] = useState(formatClock12h());
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamEndDate, setNewExamEndDate] = useState('');
  const [newExamDesc, setNewExamDesc] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatClock12h());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter subjects for active semester
  const semesterSubjects = useMemo(() => {
    return subjects.filter((s) => Number(s.semester || 2) === Number(activeSemester));
  }, [subjects, activeSemester]);

  const labSubjectsCount = useMemo(() => {
    return semesterSubjects.filter(
      (s) =>
        s.type === 'Lab' ||
        s.code.toLowerCase().includes('lab') ||
        s.code.toLowerCase().endsWith('p') ||
        s.name.toLowerCase().includes('lab')
    ).length;
  }, [semesterSubjects]);

  const theorySubjectsCount = Math.max(0, semesterSubjects.length - labSubjectsCount);

  // Filter student-specific data for active semester
  const studentAtt = useMemo(() => {
    return attendance.filter(
      (a) => a.studentId === user?.uid && attendanceSemester(a) === Number(activeSemester) &&
        semesterSubjects.some((subject) => subject.code === a.subjectCode || subject.name.toLowerCase() === a.subjectName.toLowerCase())
    );
  }, [attendance, user?.uid, activeSemester, semesterSubjects]);

  const theoryHeld = studentAtt.reduce((acc, curr) => acc + (curr.theoryHeld || 0), 0);
  const theoryPresent = studentAtt.reduce((acc, curr) => acc + (curr.theoryPresent || 0), 0);
  const theoryPct = theoryHeld > 0 ? (theoryPresent / theoryHeld) * 100 : null;

  const labHeld = studentAtt.reduce((acc, curr) => acc + (curr.labHeld || 0), 0);
  const labPresent = studentAtt.reduce((acc, curr) => acc + (curr.labPresent || 0), 0);
  const labPct = labHeld > 0 ? (labPresent / labHeld) * 100 : null;

  const totalHeld = theoryHeld + labHeld;
  const totalPresent = theoryPresent + labPresent;
  const overallAttendancePct = totalHeld > 0 ? (totalPresent / totalHeld) * 100 : null;

  // Filter lab slots for active semester
  const labSlots = useMemo(() => {
    return (timetable || []).filter((s) => {
      const matchesSem = s.semester ? Number(s.semester) === Number(activeSemester) : Number(activeSemester) === 2;
      const matchesStudent = !s.studentId || s.studentId === user?.uid;
      const isLab =
        s.type === 'Lab' ||
        s.subjectName.toLowerCase().includes('lab') ||
        s.subjectCode.toLowerCase().includes('lab') ||
        s.subjectCode.toLowerCase().endsWith('p');
      return matchesSem && matchesStudent && isLab;
    });
  }, [timetable, activeSemester, user?.uid]);

  const todayLabSlots = useMemo(() => {
    return todaySlots.filter(
      (s) =>
        s.type === 'Lab' ||
        s.subjectName.toLowerCase().includes('lab') ||
        s.subjectCode.toLowerCase().includes('lab') ||
        s.subjectCode.toLowerCase().endsWith('p')
    );
  }, [todaySlots]);

  // A strong overall average does not cancel a shortage in one subject.
  const lowAttendanceSubjects = useMemo(() => {
    return studentAtt.filter((att) => getSubjectAttendance(att).belowMinimum);
  }, [studentAtt]);

  // Calculate Internal Marks Average for active semester
  const studentMarks = useMemo(() => {
    return marks.filter(
      (m) => m.studentId === user?.uid && (m.semester ? Number(m.semester) === Number(activeSemester) : true)
    );
  }, [marks, user?.uid, activeSemester]);

  const totalScore = studentMarks.reduce((acc, m) => {
    if (m.totalMax === 50) {
      const pciaAvg = ((m.pcia1 || 0) + (m.pcia2 || 0)) / 2;
      return acc + (pciaAvg + (m.semExam / 50) * 20);
    } else {
      const cias = [m.cia1, m.cia2, m.cia3].sort((a, b) => b - a);
      const ciaAvg = (cias[0] + cias[1]) / 2;
      return acc + (ciaAvg + m.semExam);
    }
  }, 0);
  const maxScore = studentMarks.reduce((acc, m) => acc + (m.totalMax || 100), 0);
  const internalMarksAvgPct = studentMarks.length > 0 && maxScore > 0 ? (totalScore / maxScore) * 100 : null;

  // Calculate Semester Results
  const studentSems = semesterResults.filter((s) => s.studentId === user?.uid);

  const getGreeting = () => {
    const hour = parseInt(dayjs().format('H'), 10);
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const isAdmin = user?.role === 'admin';

  if (showLoader) {
    return (
      <DashboardLoader
        userName={user?.name}
        onComplete={() => {
          sessionStorage.removeItem('studentos_just_logged_in');
          setShowLoader(false);
        }}
      />
    );
  }

  if (isAdmin) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 font-['Inter',sans-serif]"
      >
        {/* Operator Hero Greeting */}
        <motion.section
          variants={cardVariants}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white shadow-xl shadow-blue-500/10 border border-white/10"
        >
          <div className="min-w-0">
            <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" /> Faculty HOD & System Operator Portal
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight truncate">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Faculty'} 👋
            </h1>
            <p className="text-xs text-blue-100 mt-1 truncate">
              Department of Computer Science & Engineering • Operator Control Console
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={() => {
                playClick();
                navigate('/admin');
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl text-xs font-extrabold shadow-lg transition flex items-center justify-center gap-2"
            >
              Open Admin Control Center →
            </button>
            <button
              onClick={() => {
                playClick();
                navigate('/profile');
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-xs font-extrabold transition flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" /> Profile
            </button>
          </div>
        </motion.section>

        {/* Operator Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div
            variants={cardVariants}
            onClick={() => {
              playClick();
              navigate('/admin');
            }}
            className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition duration-300 group"
          >
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-['Poppins','Inter',sans-serif]">
                {allStudents.length} Students
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
              {allStudents.map((s) => s.name.split(' ')[0]).join(', ')}
            </p>
          </motion.div>

          <motion.div
            variants={cardVariants}
            onClick={() => {
              playClick();
              navigate('/admin');
            }}
            className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition duration-300 group"
          >
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Semester {activeSemester} Subjects
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-['Poppins','Inter',sans-serif]">
                {subjects.filter((s) => Number(s.semester || 2) === Number(activeSemester)).length} Subjects
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Theory & Practical Labs</p>
          </motion.div>

          <motion.div
            variants={cardVariants}
            onClick={() => {
              playClick();
              navigate('/admin');
            }}
            className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition duration-300 group"
          >
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Academic Holidays
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-['Poppins','Inter',sans-serif]">
                {holidays.length} Listed
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">Academic Calendar</p>
          </motion.div>
        </div>

        {/* Admin Academic & Course Progress Tracker */}
        <motion.div variants={cardVariants} className="w-full">
          <AcademicProgressTracker
            activeSemester={activeSemester}
            academicCalendar={academicCalendar}
            onNavigateToCalendar={() => {
              playClick();
              navigate('/academic-calendar');
            }}
            onNavigateToSubjects={() => {
              playClick();
              navigate('/subjects');
            }}
          />
        </motion.div>

        {/* Operator Quick Tasks */}
        <motion.div variants={cardVariants} className="w-full">
          <div className="p-5 sm:p-7 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base border-b border-slate-200/60 dark:border-slate-800/60 pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" /> Admin Operator Action Center
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <button
                onClick={() => {
                  playClick();
                  navigate('/admin');
                }}
                className="p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-left transition duration-200"
              >
                <div className="font-bold text-blue-900 dark:text-blue-200 text-sm">Modify Student Marks</div>
                <div className="text-[11px] text-blue-600 dark:text-blue-300 mt-1">
                  Update internal CIA 1, CIA 2, CIA 3 & Sem scores for students.
                </div>
              </button>

              <button
                onClick={() => {
                  playClick();
                  navigate('/admin');
                }}
                className="p-4 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-left transition duration-200"
              >
                <div className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">Update Attendance</div>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-300 mt-1">
                  Record classes held and attended for cohort members.
                </div>
              </button>

              <button
                onClick={() => {
                  playClick();
                  navigate('/admin');
                }}
                className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-left transition duration-200"
              >
                <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">Manage Student Profiles</div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-300 mt-1">
                  Edit roll numbers, contact numbers, email addresses.
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mobile-dashboard space-y-6 font-['Inter',sans-serif]"
    >
      {/* Hero Greeting */}
      <motion.section variants={cardVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-['Poppins','Inter',sans-serif] tracking-tight truncate">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            "Success is the sum of small efforts, repeated day in and day out."
          </p>
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={() => {
              playClick();
              navigate('/profile');
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" /> View Profile
          </button>
        </div>
      </motion.section>

      {/* Low Attendance Alert */}
      {lowAttendanceSubjects.length > 0 && (
        <motion.div
          variants={cardVariants}
          role="alert"
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-start gap-3 shadow-xs"
        >
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold">Semester {activeSemester} Attendance Alert (below {MIN_SUBJECT_ATTENDANCE_PERCENT}%):</span> Low attendance recorded in{' '}
            {lowAttendanceSubjects.map((record) => `${record.subjectName} (${getSubjectAttendance(record).percentage!.toFixed(1)}%)`).join(', ')}. Attend upcoming classes to reach the minimum in each subject.
          </div>
          <button
            onClick={() => {
              playClick();
              navigate('/attendance');
            }}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 underline hover:no-underline flex-shrink-0"
          >
            Track Attendance →
          </button>
        </motion.div>
      )}

      {/* Global Semester Switcher Bar */}
      <motion.div
        data-dashboard-context
        variants={cardVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs"
      >
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Active Semester Context:</span>
          <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-xs">
            Sem {activeSemester}
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <button
              key={sem}
              onClick={() => {
                playTab();
                setActiveSemester(sem);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeSemester === sem
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Sem {sem}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Visual Progress Bars: Overall Course Completion & Active Semester Progress */}
      <motion.div data-dashboard-progress variants={cardVariants} className="w-full">
        <AcademicProgressTracker
          activeSemester={activeSemester}
          academicCalendar={academicCalendar}
          onNavigateToCalendar={() => {
            playClick();
            navigate('/academic-calendar');
          }}
          onNavigateToSubjects={() => {
            playClick();
            navigate('/subjects');
          }}
        />
      </motion.div>

      {/* Stats Row */}
      <div data-dashboard-stats className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Stat Card 1: Attendance % */}
        <motion.div
          variants={cardVariants}
          onClick={() => {
            playClick();
            navigate('/attendance');
          }}
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition duration-300 group"
        >
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Attendance %</span>
              <span className="text-[10px] text-blue-500 font-extrabold">Sem {activeSemester}</span>
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-800 dark:text-white font-['Poppins','Inter',sans-serif]">
                {overallAttendancePct !== null ? `${overallAttendancePct.toFixed(1)}%` : 'N/A'}
              </span>
              <span
                className={`text-xs font-semibold ${
                  overallAttendancePct !== null
                    ? overallAttendancePct >= MIN_SUBJECT_ATTENDANCE_PERCENT && lowAttendanceSubjects.length === 0
                      ? 'text-emerald-500'
                      : 'text-amber-500'
                    : 'text-slate-400'
                }`}
              >
                {totalHeld > 0 ? (lowAttendanceSubjects.length > 0 ? 'Subject alert' : overallAttendancePct! >= MIN_SUBJECT_ATTENDANCE_PERCENT ? 'Safe Zone' : `Below ${MIN_SUBJECT_ATTENDANCE_PERCENT}%`) : 'No Classes'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Theory: {theoryPct !== null ? `${theoryPct.toFixed(0)}%` : 'N/A'} • Lab: {labPct !== null ? `${labPct.toFixed(0)}%` : 'N/A'}
            </p>
          </div>
          <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallAttendancePct !== null && (overallAttendancePct < MIN_SUBJECT_ATTENDANCE_PERCENT || lowAttendanceSubjects.length > 0) ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${overallAttendancePct || 0}%` }}
            />
          </div>
        </motion.div>

        {/* Stat Card 2: Enrolled Subjects */}
        <motion.div
          layoutId="card-subjects"
          variants={cardVariants}
          onClick={() => {
            playClick();
            navigate('/subjects');
          }}
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition duration-300 group"
        >
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Enrolled Subjects
              </span>
              <span className="text-[10px] text-blue-500 font-extrabold">Sem {activeSemester}</span>
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-['Poppins','Inter',sans-serif]">
                {semesterSubjects.length} {semesterSubjects.length === 1 ? 'Subject' : 'Subjects'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {theorySubjectsCount} Theory • {labSubjectsCount} Practical Labs
            </p>
          </div>
          <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: semesterSubjects.length > 0 ? '100%' : '0%' }}
            />
          </div>
        </motion.div>

        {/* Stat Card 3: Upcoming Labs */}
        <motion.div
          layoutId="card-timetable"
          variants={cardVariants}
          onClick={() => {
            playClick();
            navigate('/timetable');
          }}
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition duration-300 group"
        >
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-indigo-500" /> Upcoming Labs
              </span>
              <span className="text-[10px] text-indigo-500 font-extrabold">Sem {activeSemester}</span>
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-['Poppins','Inter',sans-serif]">
                <span className="md:hidden">{labSlots.length} {labSlots.length === 1 ? 'Lab' : 'Labs'}</span>
                <span className="hidden md:inline">{labSlots.length} {labSlots.length === 1 ? 'Lab Session' : 'Lab Sessions'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {todayLabSlots.length > 0
                ? `Today: ${todayLabSlots[0].subjectName}`
                : `${labSlots.length} lab practicals scheduled`}
            </p>
          </div>
          <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: labSlots.length > 0 ? '100%' : '0%' }}
            />
          </div>
        </motion.div>

        {/* Stat Card 4: Internal Marks Avg */}
        <motion.div
          layoutId="card-marks"
          variants={cardVariants}
          onClick={() => {
            playClick();
            navigate('/marks');
          }}
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition duration-300 group"
        >
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Internal Marks Avg</span>
              <span className="text-[10px] text-blue-500 font-extrabold">Sem {activeSemester}</span>
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-800 dark:text-white font-['Poppins','Inter',sans-serif]">
                {internalMarksAvgPct !== null ? `${internalMarksAvgPct.toFixed(1)}%` : 'N/A'}
              </span>
              <span
                className={`text-xs font-semibold ${
                  internalMarksAvgPct !== null ? 'text-emerald-500' : 'text-slate-400'
                }`}
              >
                {studentMarks.length > 0 ? `${studentMarks.length} Records` : 'No Data'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {studentMarks.length > 0 ? 'CIA & Semester Performance' : 'Awaiting evaluation'}
            </p>
          </div>
          <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${internalMarksAvgPct || 0}%` }} />
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Timetable Section (col-span-8) */}
        <motion.div variants={cardVariants} className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800 dark:text-white font-['Poppins','Inter',sans-serif]">
                Today's Schedule
              </h3>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-[11px] font-bold overflow-x-auto custom-scrollbar">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <button
                    key={sem}
                    onClick={() => {
                      playTab();
                      setActiveSemester(sem);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                      activeSemester === sem
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Sem {sem}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              {todayName}
            </span>
          </div>

          {todaySlots.length === 0 ? (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-xl font-bold">
                📅
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-white font-['Poppins','Inter',sans-serif]">
                No Schedule Defined for Semester {activeSemester} on {todayName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                No classes have been populated for Semester {activeSemester} yet. You can add timetable entries in the Timetable section or switch semesters above.
              </p>
              <button
                onClick={() => {
                  playClick();
                  navigate('/timetable');
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition inline-flex items-center gap-1.5"
              >
                View Full Timetable →
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {todaySlots.map((slot, index) => (
                <div
                  key={slot.id || index}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-200 ${
                    index === 0
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500/30 shadow-lg shadow-blue-500/15'
                      : 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl text-slate-800 dark:text-white border-slate-200/60 dark:border-slate-800/80 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest ${
                          index === 0
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {formatTimeSlot12h(slot.timeSlot)}
                      </span>
                      {slot.type && (
                        <span className="text-[10px] font-semibold opacity-75">{slot.type}</span>
                      )}
                    </div>
                    <h4 className="text-base font-bold font-['Poppins','Inter',sans-serif]">{slot.subjectName}</h4>
                    <p className={`text-xs mt-0.5 ${index === 0 ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {slot.faculty ? `Faculty: ${slot.faculty}` : ''} {slot.room ? `• Room ${slot.room}` : ''}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase ${
                      index === 0 ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {slot.subjectCode}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Analytics & Side Widgets (col-span-4) */}
        <motion.div variants={cardVariants} className="lg:col-span-4 flex flex-col gap-6">
          {/* Attendance Circular Gauge */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col items-center shadow-xs">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 w-full font-['Poppins','Inter',sans-serif]">
              Overall Attendance
            </h3>
            <div className="relative flex items-center justify-center w-32 h-32 mb-4">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="54" fill="transparent" stroke="#f1f5f9" strokeWidth="10" className="dark:stroke-slate-800" />
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  fill="transparent"
                  stroke={overallAttendancePct !== null ? (overallAttendancePct >= MIN_SUBJECT_ATTENDANCE_PERCENT && lowAttendanceSubjects.length === 0 ? '#10b981' : '#f59e0b') : '#cbd5e1'}
                  strokeWidth="10"
                  strokeDasharray="339"
                  strokeDashoffset={overallAttendancePct !== null ? 339 - (339 * overallAttendancePct) / 100 : 339}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-2xl font-bold text-slate-800 dark:text-white font-['Poppins','Inter',sans-serif]">
                  {overallAttendancePct !== null ? `${overallAttendancePct.toFixed(1)}%` : 'N/A'}
                </p>
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    overallAttendancePct !== null
                      ? overallAttendancePct >= MIN_SUBJECT_ATTENDANCE_PERCENT && lowAttendanceSubjects.length === 0
                        ? 'text-emerald-500'
                        : 'text-amber-500'
                      : 'text-slate-400'
                  }`}
                >
                  {overallAttendancePct !== null
                    ? lowAttendanceSubjects.length > 0
                      ? 'Subject alert'
                      : overallAttendancePct >= MIN_SUBJECT_ATTENDANCE_PERCENT ? 'Safe Zone' : `Below ${MIN_SUBJECT_ATTENDANCE_PERCENT}%`
                    : 'No Records'}
                </p>
              </div>
            </div>
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Theory Lectures</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {theoryPct !== null ? `${theoryPct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Practical Labs</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {labPct !== null ? `${labPct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Performance Heatmap / Chart */}
          <motion.div
            layoutId="card-ygpa"
            onClick={() => {
              playClick();
              navigate('/ygpa-sgpa');
            }}
            className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex-1 cursor-pointer hover:shadow-lg transition duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 font-['Poppins','Inter',sans-serif]">
                Academic Performance
              </h3>
              <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                SGPA / YGPA →
              </span>
            </div>
            {studentSems.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-center p-3 rounded-2xl bg-slate-100/50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">No Semester Results Recorded</span>
                <span className="text-[11px] text-slate-400">Graph populates as SGPA and YGPA ledger entries are saved.</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playClick();
                    navigate('/ygpa-sgpa');
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white font-bold text-[10px] rounded-xl hover:bg-blue-700 transition"
                >
                  Enter Results →
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-end gap-2 h-32 pt-4">
                  {[1, 2, 3, 4].map((semNum) => {
                    const semRes = studentSems.find((s) => s.semester === semNum);
                    const sgpaVal = semRes ? semRes.sgpa : null;
                    const barHeightPct = sgpaVal ? Math.min((sgpaVal / 10) * 100, 100) : 4;

                    return (
                      <div
                        key={semNum}
                        className={`flex-1 rounded-t-xl transition-all duration-300 relative group flex flex-col justify-end ${
                          sgpaVal ? 'bg-gradient-to-t from-blue-600 to-indigo-600 shadow-xs' : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                        style={{ height: `${barHeightPct}%` }}
                        title={sgpaVal ? `Sem ${semNum}: SGPA ${sgpaVal.toFixed(2)}` : `Sem ${semNum}: No Data`}
                      >
                        {sgpaVal && (
                          <div className="text-[9px] font-extrabold text-white text-center pb-1">
                            {sgpaVal.toFixed(1)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mt-3">
                  <span>Sem 1</span>
                  <span>Sem 2</span>
                  <span>Sem 3</span>
                  <span>Sem 4</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Academic Daily Motivation Quote Section */}
      <motion.div variants={cardVariants} className="w-full">
        <AcademicQuoteCard />
      </motion.div>

      {/* Modal: Add Student Exam Schedule */}
      <GlassModal
        isOpen={isAddExamModalOpen}
        onClose={() => setIsAddExamModalOpen(false)}
        title="Add CIA / Exam Schedule"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newExamTitle.trim() || !newExamDate) return;
            await addCalendarEvent({
              id: 'exam_' + Date.now(),
              studentId: user?.uid,
              title: newExamTitle.trim(),
              date: newExamDate,
              endDate: newExamEndDate || undefined,
              category: 'Exam',
              description: newExamDesc.trim() || 'Student-inputted CIA exam schedule',
            });
            playSuccess();
            showToast('Exam schedule added successfully!', 'success');
            setNewExamTitle('');
            setNewExamDate('');
            setNewExamEndDate('');
            setNewExamDesc('');
            setIsAddExamModalOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Exam Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CIA 1 Assessment Week"
              value={newExamTitle}
              onChange={(e) => setNewExamTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={newExamDate}
                onChange={(e) => setNewExamDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={newExamEndDate}
                onChange={(e) => setNewExamEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. First Continuous Internal Assessment for 2nd Sem"
              value={newExamDesc}
              onChange={(e) => setNewExamDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => {
                playClick();
                setIsAddExamModalOpen(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            >
              Save Exam Schedule
            </button>
          </div>
        </form>
      </GlassModal>
    </motion.div>
  );
};

