import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  BarChart2,
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Search,
  Check
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { MarksRecord } from '../types';
import { useSound } from '../hooks/useSound';
import { useToast } from '../context/ToastContext';
import { GlassModal } from '../components/common/GlassModal';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export const MarksPage: React.FC = () => {
  const { playClick, playSuccess, playDelete } = useSound();
  const { showToast } = useToast();

  const { marks, user, allStudents, subjects, addMarksRecord, updateMarks, deleteMarksRecord } = useAppStore();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(user?.uid || 'std_001');

  const isAdmin = user?.role === 'admin';
  const activeStudentId = isAdmin ? selectedStudentId : user?.uid || 'std_001';
  const inspectedStudent = allStudents.find((s) => s.uid === activeStudentId) || user;

  // Filter marks specifically for the current active student
  const studentMarks = marks.filter((m) => m.studentId === activeStudentId);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State for CRUD operations
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MarksRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    subjectCode: string;
    subjectName: string;
    cia1: number;
    cia2: number;
    cia3: number;
    pcia1: number;
    pcia2: number;
    semExam: number;
    totalMax: number;
    grade: string;
    remarks: string;
  }>({
    subjectCode: '',
    subjectName: '',
    cia1: 18,
    cia2: 19,
    cia3: 20,
    pcia1: 0,
    pcia2: 0,
    semExam: 62,
    totalMax: 100,
    grade: '',
    remarks: 'Satisfactory Performance',
  });

  const handleOpenAddModal = () => {
    playClick();
    setEditingRecord(null);
    const defaultSubject = subjects[0];
    setFormData({
      subjectCode: defaultSubject?.code || 'CS201',
      subjectName: defaultSubject?.name || 'Computer Organization & Architecture',
      cia1: 18,
      cia2: 19,
      cia3: 20,
      pcia1: 0,
      pcia2: 0,
      semExam: 62,
      totalMax: 100,
      grade: 'A (Very Good)',
      remarks: 'Satisfactory Performance',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: MarksRecord) => {
    playClick();
    setEditingRecord(record);
    setFormData({
      subjectCode: record.subjectCode,
      subjectName: record.subjectName,
      cia1: record.cia1,
      cia2: record.cia2,
      cia3: record.cia3,
      pcia1: record.pcia1 || 0,
      pcia2: record.pcia2 || 0,
      semExam: record.semExam,
      totalMax: record.totalMax || 100,
      grade: record.grade || '',
      remarks: record.remarks || '',
    });
    setIsModalOpen(true);
  };

  const handleSubjectSelect = (code: string) => {
    const sub = subjects.find((s) => s.code === code);
    if (sub) {
      setFormData((prev) => ({
        ...prev,
        subjectCode: sub.code,
        subjectName: sub.name,
        totalMax: sub.type === 'Lab' ? 50 : 100,
      }));
    } else {
      setFormData((prev) => ({ ...prev, subjectCode: code }));
    }
  };

  const calculateSubjectTotal = (m: MarksRecord | typeof formData) => {
    if (m.totalMax === 50) {
      const pciaAvg = ((m.pcia1 || 0) + (m.pcia2 || 0)) / 2;
      return pciaAvg + (m.semExam / 50) * 20;
    } else {
      const cias = [m.cia1, m.cia2, m.cia3].sort((a, b) => b - a);
      const ciaAvg = (cias[0] + cias[1]) / 2;
      return ciaAvg + m.semExam;
    }
  };

  const calculateGradeLabel = (totalScore: number, maxScore: number) => {
    const pct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    if (pct >= 90) return 'O (Outstanding)';
    if (pct >= 80) return 'E (Excellent)';
    if (pct >= 70) return 'A (Very Good)';
    if (pct >= 60) return 'B (Good)';
    if (pct >= 50) return 'C (Fair)';
    if (pct >= 40) return 'D (Pass)';
    return 'F (Fail)';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectCode.trim() || !formData.subjectName.trim()) {
      showToast('Please enter a valid Subject Code and Subject Name.', 'error');
      return;
    }

    playSuccess();
    const calculatedTotal = calculateSubjectTotal(formData);
    const autoGrade = calculateGradeLabel(calculatedTotal, formData.totalMax);

    if (editingRecord) {
      const updated: MarksRecord = {
        ...editingRecord,
        studentId: activeStudentId,
        subjectCode: formData.subjectCode.trim().toUpperCase(),
        subjectName: formData.subjectName.trim(),
        cia1: Number(formData.cia1),
        cia2: Number(formData.cia2),
        cia3: Number(formData.cia3),
        pcia1: Number(formData.pcia1),
        pcia2: Number(formData.pcia2),
        semExam: Number(formData.semExam),
        totalMax: Number(formData.totalMax),
        grade: formData.grade.trim() || autoGrade,
        remarks: formData.remarks.trim(),
      };
      await updateMarks(updated);
      showToast(`Updated marks for ${updated.subjectCode}`, 'success');
    } else {
      const newRecord: MarksRecord = {
        id: `mrk_${Date.now()}`,
        studentId: activeStudentId,
        subjectCode: formData.subjectCode.trim().toUpperCase(),
        subjectName: formData.subjectName.trim(),
        cia1: Number(formData.cia1),
        cia2: Number(formData.cia2),
        cia3: Number(formData.cia3),
        pcia1: Number(formData.pcia1),
        pcia2: Number(formData.pcia2),
        semExam: Number(formData.semExam),
        totalMax: Number(formData.totalMax),
        grade: formData.grade.trim() || autoGrade,
        remarks: formData.remarks.trim(),
      };
      await addMarksRecord(newRecord);
      showToast(`Added new mark score for ${newRecord.subjectCode}`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    playDelete();
    await deleteMarksRecord(id);
    setDeletingId(null);
    showToast('Assessment mark record removed.', 'info');
  };

  // Filtered marks for table display
  const filteredMarks = studentMarks.filter(
    (m) =>
      m.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.subjectCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Overall analytics calculations
  const overallTotal = studentMarks.reduce((acc, m) => acc + calculateSubjectTotal(m), 0);
  const overallMax = studentMarks.reduce((acc, m) => acc + (m.totalMax || 100), 0);
  const overallPct = overallMax > 0 ? (overallTotal / overallMax) * 100 : 0;

  const chartData = studentMarks.map((m) => {
    const ciaAvg = m.totalMax === 50 ? ((m.pcia1 || 0) + (m.pcia2 || 0)) / 2 : (m.cia1 + m.cia2 + m.cia3) / 3;
    return {
      subject: m.subjectCode,
      Internal: parseFloat(ciaAvg.toFixed(1)),
      SemesterExam: m.semExam,
      TotalPercentage: parseFloat(((calculateSubjectTotal(m) / m.totalMax) * 100).toFixed(1)),
    };
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
      {/* Admin Inspector Header Selector */}
      {isAdmin && (
        <motion.div
          variants={cardVariants}
          className="p-4 rounded-3xl bg-purple-900/20 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs backdrop-blur-md"
        >
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-bold">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Admin Control Panel: Select Student Marks Record to Manage</span>
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
                🎓 {std.name} ({std.rollNumber || std.email})
              </option>
            ))}
          </select>
        </motion.div>
      )}

      {/* Header Banner */}
      <motion.div
        layoutId="card-marks"
        variants={cardVariants}
        className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-800 text-white shadow-xl shadow-purple-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="text-xs font-bold text-purple-200 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-300" /> Academic Performance & Assessment Module
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            {isAdmin ? `Marks Evaluation: ${inspectedStudent?.name}` : 'Assessment Marks Ledger'}
          </h1>
          <p className="text-xs text-purple-100/90 mt-1 max-w-xl leading-relaxed">
            Manage your CIA 1, CIA 2, CIA 3, PCIA, and End-Semester Examination scores
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
            <div className="text-center px-2">
              <div className="text-2xl sm:text-3xl font-black">{overallPct.toFixed(1)}%</div>
              <div className="text-[10px] text-purple-100 font-bold uppercase tracking-wider mt-0.5">Overall Avg</div>
            </div>
            <div className="h-9 w-[1px] bg-white/20" />
            <div className="text-xs space-y-0.5 font-medium">
              <div>Score: <strong className="text-white font-bold">{overallTotal.toFixed(1)} / {overallMax}</strong></div>
              <div>Subjects: <span className="text-emerald-300 font-bold">{studentMarks.length} Recorded</span></div>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="py-3 px-5 rounded-2xl bg-white text-purple-900 font-bold text-xs hover:bg-purple-50 transition shadow-lg flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4 text-purple-700" />
            <span>Add Assessment Score</span>
          </button>
        </div>
      </motion.div>

      {/* Marks Bar Chart Comparison */}
      {studentMarks.length > 0 && (
        <motion.div
          variants={cardVariants}
          className="p-5 sm:p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs min-w-0 w-full overflow-hidden"
        >
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-500 shrink-0" /> Internal CIA vs End-Semester Marks Comparison
          </h3>
          <div className="h-64 sm:h-52 sm:h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="subject" stroke="var(--chart-muted)" fontSize={11} />
                <YAxis stroke="var(--chart-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--chart-surface)', borderColor: 'var(--chart-border)', borderRadius: '12px', color: 'var(--page-text)' }}
                />
                <Legend />
                <Bar dataKey="Internal" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Internal CIA Avg" />
                <Bar dataKey="SemesterExam" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Sem Exam Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Subject-Wise Marks Table */}
      <motion.div
        variants={cardVariants}
        className="p-5 sm:p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4 min-w-0 w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Detailed Subject Assessment Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click edit or delete on any subject row to adjust assessment entries
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={handleOpenAddModal}
              className="py-2 px-3.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Score
            </button>
          </div>
        </div>

        {filteredMarks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No mark records found</p>
            <p className="text-xs text-slate-400 mt-0.5">Click "+ Add Score" to create your first assessment entry.</p>
          </div>
        ) : (
          <div className="scrollable-table-container custom-scrollbar min-w-0 w-full border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold">
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700">Subject</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-center">CIA 1</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-center">CIA 2</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-center">CIA 3</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-center">PCIA 1 / 2</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-center">End Sem</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-center">Total Score</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-center">Grade</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarks.map((m) => {
                  const total = calculateSubjectTotal(m);
                  const pct = (total / (m.totalMax || 100)) * 100;
                  const autoGrade = calculateGradeLabel(total, m.totalMax || 100);
                  const displayGrade = m.grade || autoGrade;

                  return (
                    <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        <div>{m.subjectName}</div>
                        <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono flex items-center gap-1">
                          <span>{m.subjectCode}</span>
                          {m.remarks && <span className="text-slate-400 font-normal">({m.remarks})</span>}
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">{m.cia1 || 0}</td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">{m.cia2 || 0}</td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">{m.cia3 || 0}</td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {m.pcia1 || m.pcia2 ? `${m.pcia1 || 0} / ${m.pcia2 || 0}` : '-'}
                      </td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">{m.semExam}</td>
                      <td className="p-3 text-center font-mono font-bold text-purple-600 dark:text-purple-400">
                        {total.toFixed(1)} / {m.totalMax || 100}
                        <div className="text-[10px] text-slate-400 font-normal">{pct.toFixed(1)}%</div>
                      </td>
                      <td className="p-3 text-center font-bold">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[11px]">
                          {displayGrade}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(m)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition"
                            title="Edit Record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              playClick();
                              setDeletingId(m.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add / Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? 'Edit Assessment Score' : 'Add New Assessment Score'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject Selector or Custom Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject Code
              </label>
              <select
                value={formData.subjectCode}
                onChange={(e) => handleSubjectSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Custom Code --</option>
                {subjects.map((sub) => (
                  <option key={sub.code} value={sub.code}>
                    {sub.code} ({sub.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Operating Systems"
                value={formData.subjectName}
                onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Score Maximum Settings */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Evaluation Scale (Total Max Marks)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, totalMax: 100 })}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition ${
                  formData.totalMax === 100
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
              >
                100 Marks (Theory)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, totalMax: 50 })}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition ${
                  formData.totalMax === 50
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
              >
                50 Marks (Lab)
              </button>
            </div>
          </div>

          {/* Internal CIA Scores Grid */}
          <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 space-y-3">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
              Internal Continuous Assessment Scores
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  CIA 1
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.cia1}
                  onChange={(e) => setFormData({ ...formData, cia1: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  CIA 2
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.cia2}
                  onChange={(e) => setFormData({ ...formData, cia2: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  CIA 3
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.cia3}
                  onChange={(e) => setFormData({ ...formData, cia3: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-purple-200/50 dark:border-purple-900/50">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Practical CIA 1
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.pcia1}
                  onChange={(e) => setFormData({ ...formData, pcia1: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Practical CIA 2
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.pcia2}
                  onChange={(e) => setFormData({ ...formData, pcia2: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 text-center"
                />
              </div>
            </div>
          </div>

          {/* Semester Exam Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Semester Exam Score
              </label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={formData.semExam}
                onChange={(e) => setFormData({ ...formData, semExam: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Grade Label (Optional override)
              </label>
              <input
                type="text"
                placeholder="e.g. O (Outstanding)"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Faculty / Student Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Excellent understanding of core concepts"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Calculated Summary Preview */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between text-xs font-semibold">
            <span>Calculated Score Preview:</span>
            <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">
              {calculateSubjectTotal(formData).toFixed(1)} / {formData.totalMax} (
              {calculateGradeLabel(calculateSubjectTotal(formData), formData.totalMax)})
            </span>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingRecord ? 'Save Changes' : 'Add Score Entry'}</span>
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Delete Confirmation Modal */}
      <GlassModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Assessment Score?"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            This action will remove this subject mark entry permanently from your document.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setDeletingId(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deletingId!)}
              className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition shadow-md"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </GlassModal>
    </motion.div>
  );
};
