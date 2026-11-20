import React from 'react';
import { motion } from 'motion/react';
import { BarChart2, TrendingUp, Award, CheckCircle2, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { attendanceSemester, getSubjectAttendance } from '../utils/attendanceThreshold';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { user, activeSemester, marks, attendance } = useAppStore();
  const semesterMarks = marks.filter((record) =>
    record.studentId === user?.uid && Number(record.semester ?? 2) === Number(activeSemester)
  );

  // Radar Chart Data for Subject Strengths
  const radarData = semesterMarks.map((m) => {
    const attRec = attendance.find(
      (a) => a.studentId === user?.uid && attendanceSemester(a) === Number(activeSemester) &&
        (a.subjectCode === m.subjectCode || a.subjectName.toLowerCase() === m.subjectName.toLowerCase())
    );
    const attPct = attRec ? getSubjectAttendance(attRec).percentage ?? 0 : 0;

    const ciaAvg = m.totalMax === 50 ? ((m.pcia1 || 0) + (m.pcia2 || 0)) / 2 : ((m.cia1 || 0) + (m.cia2 || 0) + (m.cia3 || 0)) / 3;
    const maxCia = m.totalMax === 50 ? 25 : 30;
    const scorePct = maxCia > 0 ? (ciaAvg / maxCia) * 100 : 0;

    return {
      subject: m.subjectCode.replace('RCC-', ''),
      Score: parseFloat(scorePct.toFixed(0)),
      Attendance: parseFloat(attPct.toFixed(0)),
    };
  });

  // Calculate Dynamic Grade Distribution
  const gradeCounts = { O: 0, E: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  semesterMarks.forEach((m) => {
    const total = m.totalMax === 50
      ? (((m.pcia1 || 0) + (m.pcia2 || 0)) / 2) + (m.semExam / 50) * 20
      : (([m.cia1, m.cia2, m.cia3].sort((a, b) => b - a)[0] + [m.cia1, m.cia2, m.cia3].sort((a, b) => b - a)[1]) / 2) + m.semExam;
    const pct = m.totalMax > 0 ? (total / m.totalMax) * 100 : 0;
    if (pct >= 90) gradeCounts.O++;
    else if (pct >= 80) gradeCounts.E++;
    else if (pct >= 70) gradeCounts.A++;
    else if (pct >= 60) gradeCounts.B++;
    else if (pct >= 50) gradeCounts.C++;
    else if (pct >= 40) gradeCounts.D++;
    else gradeCounts.F++;
  });

  const gradeDistributionData = [
    { name: 'O Grade (90%+)', value: gradeCounts.O },
    { name: 'E Grade (80-89%)', value: gradeCounts.E },
    { name: 'A Grade (70-79%)', value: gradeCounts.A },
    { name: 'B Grade (60-69%)', value: gradeCounts.B },
    { name: 'C Grade (50-59%)', value: gradeCounts.C },
    { name: 'D Grade (40-49%)', value: gradeCounts.D },
    { name: 'F Grade (<40%)', value: gradeCounts.F },
  ].filter((item) => item.value > 0);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#ef4444'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
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
      {/* Header Banner */}
      <motion.div
        variants={cardVariants}
        className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-purple-500" /> Executive Analytics & Intelligence
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Academic Performance Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Radar skill maps, attendance correlations, grade distribution & performance metrics
            </p>
          </div>
        </div>
      </motion.div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart: Subject Strengths */}
        <motion.div
          variants={cardVariants}
          className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs"
        >
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" /> Subject Competency Radar
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Internal Marks vs Attendance % per Subject</p>

          {radarData.length === 0 ? (
            <div className="h-52 sm:h-72 w-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No competency data available</p>
              <p className="text-xs text-slate-400 mt-0.5">Add mark entries to generate the radar skill map.</p>
            </div>
          ) : (
            <div className="h-52 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" opacity={0.3} />
                  <PolarAngleAxis dataKey="subject" stroke="var(--chart-muted)" fontSize={11} />
                  <PolarRadiusAxis domain={[0, 100]} stroke="var(--chart-muted)" fontSize={10} />
                  <Radar name="Marks Score %" dataKey="Score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                  <Radar name="Attendance %" dataKey="Attendance" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--chart-surface)', borderColor: 'var(--chart-border)', borderRadius: '12px', color: 'var(--page-text)' }} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Grade Distribution Pie */}
        <motion.div
          variants={cardVariants}
          className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs"
        >
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-1 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> Grade Distribution Analysis
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Proportion of Course Grades in CSE Semester</p>

          {gradeDistributionData.length === 0 ? (
            <div className="h-52 sm:h-72 w-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Award className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No grade distribution data</p>
              <p className="text-xs text-slate-400 mt-0.5">Grade proportions will render when marks exist.</p>
            </div>
          ) : (
            <div className="h-52 sm:h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gradeDistributionData} cx="50%" cy="50%" outerRadius={90} label dataKey="value">
                    {gradeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--chart-surface)', borderColor: 'var(--chart-border)', borderRadius: '12px', color: 'var(--page-text)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
