import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BookOpen,
  User,
  Mail,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  FolderDown,
  FileText,
  Info,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useSchedule } from '../hooks/useSchedule';
import { useSound } from '../hooks/useSound';
import { GlassModal } from '../components/common/GlassModal';
import { Subject } from '../types';
import { MIN_SUBJECT_ATTENDANCE_PERCENT, attendanceSemester, getSubjectAttendance } from '../utils/attendanceThreshold';

export const SubjectsPage: React.FC = () => {
  const { user, subjects, attendance, marks, addSubject, updateSubject, deleteSubject } = useAppStore();
  const { activeSemester, setActiveSemester } = useSchedule();
  const { playPop, playSuccess, playClick } = useSound();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const codeParam = searchParams.get('code');

  // Filter subjects for current active semester
  const semesterSubjects = subjects.filter((s) => {
    if (s.semester) return Number(s.semester) === Number(activeSemester);
    return Number(activeSemester) === 2;
  });

  const [selectedCode, setSelectedCode] = useState<string>(
    codeParam || semesterSubjects[0]?.code || ''
  );

  useEffect(() => {
    if (codeParam) {
      setSelectedCode(codeParam);
    } else if (semesterSubjects.length > 0 && (!selectedCode || !semesterSubjects.some((s) => s.code === selectedCode))) {
      setSelectedCode(semesterSubjects[0].code);
    }
  }, [codeParam, semesterSubjects, activeSemester]);

  const currentSubject = semesterSubjects.find((s) => s.code === selectedCode) || semesterSubjects[0];
  const currentAttendance = attendance.find((a) =>
    a.studentId === user?.uid && a.subjectCode === selectedCode && attendanceSemester(a) === Number(activeSemester)
  );
  const currentAttendanceSummary = currentAttendance ? getSubjectAttendance(currentAttendance) : null;
  const currentMark = marks.find((m) => m.subjectCode === selectedCode);

  // Subject Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    faculty: '',
    facultyEmail: '',
    credits: 4,
    type: 'Theory' as 'Theory' | 'Lab' | 'Audit',
    room: '',
    description: '',
    syllabus: '',
    books: '',
    semester: activeSemester,
  });

  const openAddModal = () => {
    playPop();
    setEditingSubject(null);
    setFormData({
      code: '',
      name: '',
      faculty: '',
      facultyEmail: '',
      credits: 4,
      type: 'Theory',
      room: '',
      description: '',
      syllabus: '',
      books: '',
      semester: activeSemester,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    playPop();
    setEditingSubject(sub);
    setFormData({
      code: sub.code,
      name: sub.name,
      faculty: sub.faculty,
      facultyEmail: sub.facultyEmail || '',
      credits: sub.credits,
      type: sub.type,
      room: sub.room,
      description: sub.description,
      syllabus: sub.syllabus ? sub.syllabus.join('\n') : '',
      books: sub.books ? sub.books.join('\n') : '',
      semester: sub.semester || activeSemester,
    });
    setIsModalOpen(true);
  };

  const handleSubmitSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) return;

    const syllabusArray = formData.syllabus
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const booksArray = formData.books
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const targetSem = Number(formData.semester) || activeSemester;

    if (editingSubject) {
      const updated: Subject = {
        ...editingSubject,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        faculty: formData.faculty.trim() || 'Faculty In-Charge',
        facultyEmail: formData.facultyEmail.trim(),
        credits: Number(formData.credits) || 0,
        type: formData.type,
        room: formData.room.trim() || 'TBA',
        description: formData.description.trim(),
        syllabus: syllabusArray,
        books: booksArray,
        semester: targetSem,
      };
      await updateSubject(updated);
      setSelectedCode(updated.code);
    } else {
      const newSub: Subject = {
        id: `sub_${Date.now()}`,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        faculty: formData.faculty.trim() || 'Faculty In-Charge',
        facultyEmail: formData.facultyEmail.trim(),
        credits: Number(formData.credits) || 0,
        type: formData.type,
        room: formData.room.trim() || 'TBA',
        description: formData.description.trim(),
        syllabus: syllabusArray,
        books: booksArray,
        semester: targetSem,
      };
      await addSubject(newSub);
      setSelectedCode(newSub.code);
    }

    playSuccess();
    setIsModalOpen(false);
  };

  const handleDeleteSubject = async (subId: string) => {
    playClick();
    await deleteSubject(subId);
    if (semesterSubjects.length > 1) {
      const nextSub = semesterSubjects.find((s) => s.id !== subId);
      if (nextSub) setSelectedCode(nextSub.code);
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-6 w-full min-w-0 pb-12"
    >
      {/* Header Banner */}
      <motion.div
        layoutId="card-subjects"
        variants={cardVariants}
        className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-500" /> Subject Curriculum Directory
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Academic Subjects & Modules
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Semester {activeSemester} B.Tech Course Outlines & Recommended Materials
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add New Subject
          </button>
        </div>
      </motion.div>

      {/* Semester Selector Bar */}
      <motion.div
        variants={cardVariants}
        className="p-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center gap-1.5 overflow-x-auto custom-scrollbar"
      >
        <span className="text-xs font-extrabold text-slate-400 px-3 uppercase tracking-wider whitespace-nowrap">
          Semester:
        </span>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
          <button
            key={sem}
            onClick={() => {
              playClick();
              setActiveSemester(sem);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSemester === sem
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Sem {sem}
          </button>
        ))}
      </motion.div>

      {/* Subject Navigation Tabs Bar */}
      {semesterSubjects.length > 0 ? (
        <motion.div variants={cardVariants} className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {semesterSubjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => {
                playClick();
                setSelectedCode(sub.code);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
                selectedCode === sub.code
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                  : 'bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="font-mono text-[10px] opacity-80">{sub.code}</span>
              <span>{sub.name}</span>
            </button>
          ))}
        </motion.div>
      ) : (
        <motion.div
          variants={cardVariants}
          className="p-8 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No Subjects for Semester {activeSemester}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              No official subject data is currently pre-loaded for Semester {activeSemester}. Add subjects manually below.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition inline-flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add First Subject for Sem {activeSemester}
          </button>
        </motion.div>
      )}

      {/* Main Selected Subject Card */}
      {currentSubject && (
        <motion.div variants={cardVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Subject Details & Syllabus */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs">
                      {currentSubject.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">Semester {currentSubject.semester || activeSemester}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
                    {currentSubject.name}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xs">
                      {currentSubject.type} ({currentSubject.credits} Credits)
                    </span>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 justify-end">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" /> Room: {currentSubject.room}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(currentSubject)}
                      title="Edit Subject"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                    >
                      <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(currentSubject.id)}
                      title="Delete Subject"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 transition"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentSubject.description || 'No detailed description available for this subject.'}
              </p>

              {/* Faculty Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Faculty In-Charge</div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">
                    {currentSubject.faculty}
                  </div>
                  {currentSubject.facultyEmail && (
                    <div className="text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-blue-500" /> {currentSubject.facultyEmail}
                    </div>
                  )}
                </div>
              </div>

              {/* Syllabus Topics */}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">
                  Syllabus Module Breakdown
                </h3>
                {currentSubject.syllabus && currentSubject.syllabus.length > 0 ? (
                  <div className="space-y-2">
                    {currentSubject.syllabus.map((topic, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        {topic}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No syllabus breakdown topics added yet.</p>
                )}
              </div>

              {/* Textbooks */}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
                  Recommended Textbooks & References
                </h3>
                {currentSubject.books && currentSubject.books.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    {currentSubject.books.map((book, idx) => (
                      <li key={idx}>{book}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">No recommended textbooks specified.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Performance & Quick Actions */}
          <div className="space-y-6">
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Module Metrics</h3>

              {currentAttendanceSummary ? (
                <div className={`p-4 rounded-2xl border ${currentAttendanceSummary.belowMinimum ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40' : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40'}`}>
                  <div className={`text-[10px] font-bold uppercase ${currentAttendanceSummary.belowMinimum ? 'text-rose-800 dark:text-rose-300' : 'text-emerald-800 dark:text-emerald-300'}`}>Attendance Status · Sem {activeSemester}</div>
                  <div className={`text-2xl font-black mt-0.5 ${currentAttendanceSummary.belowMinimum ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {currentAttendanceSummary.percentage === null ? 'N/A' : `${currentAttendanceSummary.percentage.toFixed(1)}%`}
                  </div>
                  <div className={`text-[11px] mt-1 ${currentAttendanceSummary.belowMinimum ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                    {currentAttendanceSummary.present} / {currentAttendanceSummary.held} Total Attended
                    {currentAttendanceSummary.belowMinimum && <span className="block font-bold">Alert: Below the {MIN_SUBJECT_ATTENDANCE_PERCENT}% minimum</span>}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                  No attendance records logged for this module.
                </div>
              )}

              {currentMark ? (
                <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40">
                  <div className="text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase">Internal Score</div>
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                    CIA Avg: {((currentMark.cia1 + currentMark.cia2 + currentMark.cia3) / 3).toFixed(1)} / 30
                  </div>
                  <div className="text-[11px] text-purple-700 dark:text-purple-300 mt-1">
                    End Sem Exam: {currentMark.semExam} Marks
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                  No marks entries recorded for this subject.
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    playClick();
                    navigate('/calendar');
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4 text-emerald-500" /> View Assignments
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add / Edit Subject Glass Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : `Add Subject (Semester ${activeSemester})`}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmitSubject} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PCC-CS301"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Data Structures & Algorithms"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Faculty In-Charge
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. A. Ghosh"
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Faculty Email
              </label>
              <input
                type="email"
                placeholder="e.g. faculty@example.com"
                value={formData.facultyEmail}
                onChange={(e) => setFormData({ ...formData, facultyEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Semester
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Theory">Theory</option>
                <option value="Lab">Lab</option>
                <option value="Audit">Audit</option>
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
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Room No.
              </label>
              <input
                type="text"
                placeholder="e.g. N 301"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Course Overview / Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of course objectives and scope..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Syllabus Topics (One per line)
            </label>
            <textarea
              rows={3}
              placeholder="Module 1: Linear Data Structures&#10;Module 2: Trees and Graphs"
              value={formData.syllabus}
              onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-[11px] resize-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Recommended Textbooks (One per line)
            </label>
            <textarea
              rows={2}
              placeholder="Data Structures using C - Reema Thareja&#10;Fundamentals of Data Structures - Horowitz"
              value={formData.books}
              onChange={(e) => setFormData({ ...formData, books: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-[11px] resize-none"
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md shadow-blue-500/20"
            >
              {editingSubject ? 'Save Changes' : 'Add Subject'}
            </button>
          </div>
        </form>
      </GlassModal>
    </motion.div>
  );
};
