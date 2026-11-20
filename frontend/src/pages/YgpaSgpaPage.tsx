import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  TrendingUp,
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  Save,
  AlertCircle,
  Calculator,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SemesterResult } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useSound } from '../hooks/useSound';
import { useToast } from '../context/ToastContext';
import { GlassModal } from '../components/common/GlassModal';

export const YgpaSgpaPage: React.FC = () => {
  const { semesterResults, user, allStudents, addSemesterResult, updateSemesterResult, deleteSemesterResult } = useAppStore();
  const { playPop, playSuccess, playClick } = useSound();
  const { addToast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(user?.uid || 'std_001');

  const isAdmin = user?.role === 'admin';
  const activeStudentId = isAdmin ? selectedStudentId : user?.uid || 'std_001';
  const inspectedStudent = allStudents.find((s) => s.uid === activeStudentId) || user;

  // Filter semester results for active student
  const studentSemesters = semesterResults
    .filter((s) => s.studentId === activeStudentId)
    .sort((a, b) => a.semester - b.semester);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<SemesterResult | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calculator Tool State
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcTargetSgpa, setCalcTargetSgpa] = useState<number>(8.8);

  // Form State
  const [formData, setFormData] = useState<{
    semester: number;
    sgpa: number;
    ygpa: number;
    creditsEarned: number;
    totalCredits: number;
    backlogs: number;
    rank: number;
    academicYear: string;
    status: string;
  }>({
    semester: 1,
    sgpa: 0,
    ygpa: 0,
    creditsEarned: 0,
    totalCredits: 0,
    backlogs: 0,
    rank: 0,
    academicYear: '',
    status: '',
  });

  const handleOpenAddModal = () => {
    playPop();
    setEditingResult(null);
    const nextSemNum = studentSemesters.length > 0 ? studentSemesters[studentSemesters.length - 1].semester + 1 : 1;
    setFormData({
      semester: nextSemNum,
      sgpa: 0,
      ygpa: 0,
      creditsEarned: 0,
      totalCredits: 0,
      backlogs: 0,
      rank: 0,
      academicYear: '',
      status: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (res: SemesterResult) => {
    playPop();
    setEditingResult(res);
    setFormData({
      semester: res.semester,
      sgpa: res.sgpa,
      ygpa: res.ygpa,
      creditsEarned: res.creditsEarned,
      totalCredits: res.totalCredits || res.creditsEarned,
      backlogs: res.backlogs || 0,
      rank: res.rank || 1,
      academicYear: res.academicYear || '',
      status: res.status || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingResult) {
      const updated: SemesterResult = {
        ...editingResult,
        studentId: activeStudentId,
        semester: Number(formData.semester),
        sgpa: Number(formData.sgpa),
        ygpa: Number(formData.ygpa),
        creditsEarned: Number(formData.creditsEarned),
        totalCredits: Number(formData.totalCredits),
        backlogs: Number(formData.backlogs),
        rank: Number(formData.rank),
        academicYear: formData.academicYear.trim(),
        status: formData.status.trim(),
      };
      await updateSemesterResult(updated);
      addToast(`Updated Semester ${updated.semester} performance record!`, 'success');
    } else {
      const newResult: SemesterResult = {
        id: `sem_${Date.now()}`,
        studentId: activeStudentId,
        semester: Number(formData.semester),
        sgpa: Number(formData.sgpa),
        ygpa: Number(formData.ygpa),
        creditsEarned: Number(formData.creditsEarned),
        totalCredits: Number(formData.totalCredits),
        backlogs: Number(formData.backlogs),
        rank: Number(formData.rank),
        academicYear: formData.academicYear.trim(),
        status: formData.status.trim(),
      };
      await addSemesterResult(newResult);
      addToast(`Added Semester ${newResult.semester} record to academic!`, 'success');
    }

    playSuccess();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    playClick();
    await deleteSemesterResult(id);
    setDeletingId(null);
    addToast('Semester record removed from ledger.', 'info');
  };

  const latestSemester = studentSemesters.length > 0 ? studentSemesters[studentSemesters.length - 1] : null;

  const cumulativeCredits = studentSemesters.reduce((acc, s) => acc + (s.creditsEarned || 0), 0);

  const chartData = studentSemesters.map((s) => ({
    semester: `Sem ${s.semester}`,
    SGPA: s.sgpa,
    YGPA: s.ygpa,
    Credits: s.creditsEarned,
  }));

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
      {/* Admin Inspector Header Selector */}
      {isAdmin && (
        <motion.div
          variants={cardVariants}
          className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 backdrop-blur-md border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Admin Operator Mode: Inspecting Student Academic Ledger</span>
          </div>

          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {allStudents.map((std) => (
              <option key={std.uid} value={std.uid}>
                🎓 {std.name} ({std.rollNumber || std.email})
              </option>
            ))}
          </select>
        </motion.div>
      )}

      {/* Header Banner */}
      <motion.div
        layoutId="card-ygpa"
        variants={cardVariants}
        className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-500" /> Academic Credit & GPA Tracker
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAdmin ? `${inspectedStudent?.name} - SGPA & YGPA Summary` : 'SGPA & YGPA Academic Ledger'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Official MAKAUT Credit System & Cumulative Grade Point Average
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                  {latestSemester ? latestSemester.ygpa.toFixed(2) : '0.00'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Cumulative YGPA</div>
              </div>
              <div className="h-9 w-[1px] bg-slate-200 dark:bg-slate-700" />
              <div className="text-xs space-y-0.5 text-slate-700 dark:text-slate-300">
                <div>Latest SGPA: <strong className="text-slate-900 dark:text-white">{latestSemester ? latestSemester.sgpa.toFixed(2) : '0.00'}</strong></div>
                <div>Standing: <strong className="text-emerald-600 dark:text-emerald-400">{latestSemester ? latestSemester.status || 'Passed' : 'No Records'}</strong></div>
              </div>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Semester Record</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Metric Quick Cards */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Latest Semester SGPA</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {latestSemester ? latestSemester.sgpa.toFixed(2) : '0.00'}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            {latestSemester ? `Sem ${latestSemester.semester} Evaluation` : 'No Data Available'}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Cumulative YGPA</div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {latestSemester ? latestSemester.ygpa.toFixed(2) : '0.00'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {latestSemester ? 'Recorded Grade' : 'No Data Available'}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Credits Earned</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{cumulativeCredits} Credits</div>
          <div className="text-[10px] text-slate-400 mt-1">{studentSemesters.length} Semesters Recorded</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Active Backlogs</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {latestSemester ? (latestSemester.backlogs || 0) : 0}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            {latestSemester ? (latestSemester.backlogs === 0 ? 'Clean Record' : 'Backlog Action Needed') : 'No Active Backlogs'}
          </div>
        </div>
      </motion.div>

      {/* Progression Area Chart */}
      {studentSemesters.length > 0 && (
        <motion.div
          variants={cardVariants}
          className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs min-w-0 w-full overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" /> SGPA / YGPA Growth Progression
            </h3>
            <button
              onClick={() => {
                playClick();
                setIsCalcOpen(!isCalcOpen);
              }}
              className="py-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{isCalcOpen ? 'Hide Target Predictor' : 'GPA Target Predictor'}</span>
            </button>
          </div>

          {/* Interactive Calculator Drawer */}
          {isCalcOpen && latestSemester && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 space-y-3"
            >
              <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-600" /> Target SGPA & YGPA Projection Tool
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Enter Desired Next Semester SGPA: {calcTargetSgpa}
                  </label>
                  <input
                    type="range"
                    min={6.0}
                    max={10.0}
                    step={0.1}
                    value={calcTargetSgpa}
                    onChange={(e) => setCalcTargetSgpa(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
                  <span>Projected Cumulative YGPA:</span>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {((latestSemester.ygpa + calcTargetSgpa) / 2).toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="h-52 sm:h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="semester" stroke="var(--chart-muted)" fontSize={12} />
                <YAxis domain={[0, 10]} stroke="var(--chart-muted)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--chart-surface)', borderColor: 'var(--chart-border)', borderRadius: '12px', color: 'var(--page-text)' }} />
                <Area type="monotone" dataKey="SGPA" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={3} />
                <Area type="monotone" dataKey="YGPA" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Semester Wise Table & CRUD Controls */}
      <motion.div
        variants={cardVariants}
        className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4 min-w-0 w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Semester Performance History Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your semester scores, credits, and backlogs directly
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Semester Record
          </button>
        </div>

        {studentSemesters.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Award className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No semester performance entries recorded</p>
            <p className="text-xs text-slate-400 mt-0.5">Click "+ Add Semester Record" to log your SGPA and credit metrics.</p>
          </div>
        ) : (
          <div className="scrollable-table-container custom-scrollbar min-w-0 w-full">
            <table className="w-full text-xs text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold">
                  <th className="p-3 border border-slate-200/60 dark:border-slate-700/60">Semester</th>
                  <th className="p-3 border border-slate-200/60 dark:border-slate-700/60 text-center">Academic Year</th>
                  <th className="p-3 border border-slate-200/60 dark:border-slate-700/60 text-center">Credits Earned</th>
                  <th className="p-3 border border-slate-200/60 dark:border-slate-700/60 text-center">SGPA</th>
                  <th className="p-3 border border-slate-200/60 dark:border-slate-700/60 text-center">YGPA</th>
                  <th className="p-3 border border-slate-200/60 dark:border-slate-700/60 text-center">Status</th>
                  <th className="p-3 border border-slate-200/60 dark:border-slate-700/60 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentSemesters.map((s) => (
                  <tr key={s.id} className="border-b border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">Semester {s.semester}</td>
                    <td className="p-3 text-center text-slate-500 dark:text-slate-400">{s.academicYear}</td>
                    <td className="p-3 text-center font-mono font-semibold">{s.creditsEarned} Credits</td>
                    <td className="p-3 text-center font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">{s.sgpa}</td>
                    <td className="p-3 text-center font-bold text-purple-600 dark:text-purple-400 font-mono text-sm">{s.ygpa}</td>
                    <td className="p-3 text-center font-bold">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 text-[11px]">
                        {s.status || ''}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                          title="Edit Semester Record"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            playClick();
                            setDeletingId(s.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                          title="Delete Semester Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add / Edit Semester Result Glass Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingResult ? `Edit Semester ${editingResult.semester} Record` : 'Add Semester Performance'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Semester Number
              </label>
              <input
                type="number"
                min={1}
                max={12}
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2025-2026"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Semester SGPA (0 - 10)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={10}
                required
                value={formData.sgpa}
                onChange={(e) => setFormData({ ...formData, sgpa: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-blue-600 dark:text-blue-400 font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cumulative YGPA (0 - 10)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={10}
                required
                value={formData.ygpa}
                onChange={(e) => setFormData({ ...formData, ygpa: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-purple-600 dark:text-purple-400 font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Credits Earned
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                required
                value={formData.creditsEarned}
                onChange={(e) => setFormData({ ...formData, creditsEarned: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Backlogs Count
              </label>
              <input
                type="number"
                min={0}
                value={formData.backlogs}
                onChange={(e) => setFormData({ ...formData, backlogs: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Academic Status
            </label>
            <input
              type="text"
              placeholder="e.g. PASSED (Distinction)"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingResult ? 'Save Changes' : 'Save Record'}</span>
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Delete Confirmation Glass Modal */}
      <GlassModal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        title="Delete Semester Entry?"
        maxWidth="sm"
      >
        <div className="text-center space-y-4 text-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            This action will permanently delete this semester record from your academic ledger.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setDeletingId(null)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => deletingId && handleDelete(deletingId)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-md shadow-rose-500/20"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </GlassModal>
    </motion.div>
  );
};
