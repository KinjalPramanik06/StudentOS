import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Mail,
  Phone,
  Droplet,
  GraduationCap,
  Award,
  CheckCircle2,
  Edit2,
  ShieldCheck,
  Users,
  Save,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { userProfileSchema } from '../lib/validation';
import { useSound } from '../hooks/useSound';
import { useToast } from '../context/ToastContext';
import { GlassModal } from '../components/common/GlassModal';
import { ProfileAvatar } from '../components/common/ProfileAvatar';

export const ProfilePage: React.FC = () => {
  const { user, allStudents, updateUserProfile, semesterResults } = useAppStore();
  const { playPop, playSuccess, playClick } = useSound();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // If Admin is inspecting/editing another student
  const [selectedProfileId, setSelectedProfileId] = useState<string>(user?.uid || '');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Determine active profile being viewed
  const activeProfile: UserProfile =
    user?.role === 'admin'
      ? selectedProfileId === user.uid
        ? user
        : allStudents.find((s) => s.uid === selectedProfileId) || user
      : user || ({} as UserProfile);

  // Form Inputs
  const [nameInput, setNameInput] = useState(activeProfile.name || '');
  const [emailInput, setEmailInput] = useState(activeProfile.email || '');
  const [phoneInput, setPhoneInput] = useState(activeProfile.phone || '');
  const [bloodGroupInput, setBloodGroupInput] = useState(activeProfile.bloodGroup || 'O+');
  const [photoUrlInput, setPhotoUrlInput] = useState(activeProfile.photoURL || '');
  const [rollNumberInput, setRollNumberInput] = useState(activeProfile.rollNumber || '');
  const [regNumberInput, setRegNumberInput] = useState(activeProfile.regNumber || '');
  const [univRollNumberInput, setUnivRollNumberInput] = useState(activeProfile.univRollNumber || '');
  const [sectionInput, setSectionInput] = useState(activeProfile.section || 'CSE A');
  const [semesterInput, setSemesterInput] = useState(activeProfile.semester || '2nd Semester');

  // Keep state inputs synced when active profile changes
  useEffect(() => {
    if (activeProfile) {
      setNameInput(activeProfile.name || '');
      setEmailInput(activeProfile.email || '');
      setPhoneInput(activeProfile.phone || '');
      setBloodGroupInput(activeProfile.bloodGroup || 'O+');
      setPhotoUrlInput(activeProfile.photoURL || '');
      setRollNumberInput(activeProfile.rollNumber || '');
      setRegNumberInput(activeProfile.regNumber || '');
      setUnivRollNumberInput(activeProfile.univRollNumber || '');
      setSectionInput(activeProfile.section || 'CSE A');
      setSemesterInput(activeProfile.semester || '2nd Semester');
    }
  }, [selectedProfileId, user, activeProfile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile || isSaving) return;

    const currentAccess = activeProfile.dataAccess || 'Full Read & Write';
    if (!isAdmin && currentAccess !== 'Full Read & Write') {
      addToast(`Permission Denied: Your Data Access level is set to "${currentAccess}" by Faculty Admin. Contact admin to modify profile details.`, 'error');
      setShowEditModal(false);
      return;
    }

    try {
      const photo = photoUrlInput.trim();
      if (photo && photo !== activeProfile.photoURL && !/^(https?:\/\/|\/avatars\/)[^\s]+$/i.test(photo)) {
        addToast('Use an http/https photo URL or an /avatars/ path, or leave this field blank to keep your photo.', 'error');
        return;
      }
      setIsSaving(true);
      const rawProfile: UserProfile = {
        ...activeProfile,
        name: nameInput,
        email: emailInput,
        phone: phoneInput,
        bloodGroup: bloodGroupInput,
        photoURL: photo || activeProfile.photoURL,
        rollNumber: rollNumberInput,
        regNumber: regNumberInput,
        univRollNumber: univRollNumberInput,
        section: sectionInput,
        semester: semesterInput,
      };

      const validatedProfile = userProfileSchema.parse(rawProfile) as UserProfile;

      await updateUserProfile(validatedProfile);
      playSuccess();
      setShowEditModal(false);
      addToast(`Profile for ${validatedProfile.name} successfully updated!`, 'success');
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors)) {
        addToast(`Validation error: ${err.errors[0]?.message || 'Invalid input'}`, 'error');
      } else {
        addToast(`Error saving profile: ${err.message || 'Validation failed'}`, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isEditingSelf = user?.uid === activeProfile.uid;

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
      {/* Admin Quick Profile Selector */}
      {isAdmin && (
        <motion.div
          variants={cardVariants}
          className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-bold">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Admin Control Panel: Select Profile to View or Edit</span>
          </div>

          <select
            value={selectedProfileId}
            onChange={(e) => {
              playClick();
              setSelectedProfileId(e.target.value);
            }}
            className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={user.uid}>⭐ My Admin Profile ({user.name})</option>
            <optgroup label="CSE A Cohort Students">
              {allStudents.map((std) => (
                <option key={std.uid} value={std.uid}>
                  🎓 {std.name} ({std.rollNumber})
                </option>
              ))}
            </optgroup>
          </select>
        </motion.div>
      )}

      {/* Profile Banner Card */}
      <motion.div
        data-profile-banner
        variants={cardVariants}
        className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <ProfileAvatar
            src={activeProfile?.photoURL}
            userId={activeProfile?.uid}
            alt={activeProfile?.name}
            className="w-24 h-24 rounded-3xl ring-4 ring-slate-100 dark:ring-slate-800 shadow-lg"
          />

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeProfile?.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                {activeProfile?.role === 'admin' ? 'Faculty HOD / Admin' : 'Regular Student'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {activeProfile?.department} • {activeProfile?.semester} • Section {activeProfile?.section}
            </p>
            <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-3 text-xs font-mono text-slate-600 dark:text-slate-300">
              <span>Class Roll: {activeProfile?.rollNumber || 'N/A'}</span>
              <span>•</span>
              <span>Reg: {activeProfile?.regNumber || 'N/A'}</span>
              <span>•</span>
              <span>Univ Roll: {activeProfile?.univRollNumber || 'N/A'}</span>
            </div>
          </div>

          <button
            onClick={() => {
              playPop();
              setNameInput(activeProfile.name || '');
              setEmailInput(activeProfile.email || '');
              setPhoneInput(activeProfile.phone || '');
              setBloodGroupInput(activeProfile.bloodGroup || 'O+');
              setPhotoUrlInput(activeProfile.photoURL || '');
              setRollNumberInput(activeProfile.rollNumber || '');
              setRegNumberInput(activeProfile.regNumber || '');
              setUnivRollNumberInput(activeProfile.univRollNumber || '');
              setSectionInput(activeProfile.section || 'CSE A');
              setSemesterInput(activeProfile.semester || '2nd Semester');
              setShowEditModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0"
          >
            <Edit2 className="w-4 h-4" /> {isAdmin && !isEditingSelf ? `Edit ${activeProfile.name}` : 'Edit Profile Details'}
          </button>
        </div>
      </motion.div>

      {/* Information Cards Grid */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base border-b border-slate-200/60 dark:border-slate-800/60 pb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Profile & Contact Details
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {isAdmin ? 'Admin Edit Mode' : 'Student Verified'}
            </span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="text-slate-400">Full Name:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{activeProfile?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="text-slate-400 font-mono">Class Roll Number:</span>
              <span className="font-bold font-mono text-blue-600 dark:text-blue-400">{activeProfile?.rollNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="text-slate-400 font-mono">Registration Number:</span>
              <span className="font-bold font-mono text-purple-600 dark:text-purple-400">{activeProfile?.regNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="text-slate-400 font-mono">University Roll Number:</span>
              <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{activeProfile?.univRollNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="text-slate-400">Institute Email:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{activeProfile?.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="text-slate-400">Phone Number:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{activeProfile?.phone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="text-slate-400">Blood Group:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{activeProfile?.bloodGroup}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="text-slate-400 font-medium">Data Access Privilege:</span>
              <span
                className={`font-bold text-[11px] px-2.5 py-0.5 rounded-full border ${
                  (activeProfile?.dataAccess || 'Full Read & Write') === 'Full Read & Write'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : (activeProfile?.dataAccess || 'Full Read & Write') === 'Read Only'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                }`}
              >
                {(activeProfile?.dataAccess || 'Full Read & Write') === 'Full Read & Write'
                  ? '🔓 Full Read & Write'
                  : (activeProfile?.dataAccess || 'Full Read & Write') === 'Read Only'
                  ? '👁️ Read Only'
                  : '⛔ Restricted'}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Highlights or Admin Privileges */}
        {activeProfile?.role === 'admin' ? (
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base border-b border-slate-200/60 dark:border-slate-800/60 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" /> Administrative System Privileges
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40">
                <div className="text-[10px] text-purple-600 font-bold uppercase">Operator Role</div>
                <div className="text-sm font-black text-purple-800 dark:text-purple-200 mt-0.5">Administrator</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
                <div className="text-[10px] text-blue-600 font-bold uppercase">Data Access</div>
                <div className="text-sm font-black text-blue-800 dark:text-blue-200 mt-0.5">Full Read & Write</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                <div className="text-[10px] text-emerald-600 font-bold uppercase">Account Status</div>
                <div className="text-sm font-black text-emerald-700 dark:text-emerald-300 mt-0.5">DB Synced</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                <div className="text-[10px] text-amber-600 font-bold uppercase">Cohort Scope</div>
                <div className="text-sm font-black text-amber-800 dark:text-amber-200 mt-0.5">CSE B.Tech Cohort</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base border-b border-slate-200/60 dark:border-slate-800/60 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Academic Standing & Performance
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                Student Self-Edit Active
              </span>
            </h3>

            {(() => {
              const mySemesters = semesterResults.filter((s) => s.studentId === activeProfile.uid);

              if (mySemesters.length === 0) {
                return (
                  <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800/60 text-center space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-lg font-bold">
                      📊
                    </div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">No Assessment Results Recorded Yet</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      Academic standing metrics (SGPA, YGPA, and credit totals) will populate here as assessment records or semester results are entered.
                    </p>
                    <div className="pt-1 flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => {
                          playClick();
                          navigate('/ygpa-sgpa');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition shadow-xs"
                      >
                        Enter YGPA / SGPA →
                      </button>
                      <button
                        onClick={() => {
                          playClick();
                          navigate('/marks');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition shadow-xs"
                      >
                        Enter Assessment Marks →
                      </button>
                    </div>
                  </div>
                );
              }

              const latest = mySemesters[mySemesters.length - 1];
              const cumCredits = mySemesters.reduce((acc, s) => acc + (s.creditsEarned || 0), 0);

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Latest SGPA</div>
                      <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-0.5">{latest.sgpa?.toFixed(2) || 'N/A'}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40">
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">Cumulative YGPA</div>
                      <div className="text-xl font-black text-purple-700 dark:text-purple-300 mt-0.5">{latest.ygpa?.toFixed(2) || 'N/A'}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Credits Cleared</div>
                      <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{cumCredits} Credits</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        playClick();
                        navigate('/ygpa-sgpa');
                      }}
                      className="py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-500" /> Manage YGPA & SGPA Records →
                    </button>
                    <button
                      onClick={() => {
                        playClick();
                        navigate('/marks');
                      }}
                      className="py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-100 dark:hover:bg-purple-900/80 transition flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-purple-500" /> Manage Assessment Scores →
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </motion.div>

      {/* Edit Profile Glass Modal */}
      <GlassModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Update Profile: ${activeProfile.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleProfileSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Class Roll Number</label>
              <input
                type="text"
                required
                value={rollNumberInput}
                onChange={(e) => setRollNumberInput(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Registration Number</label>
              <input
                type="text"
                required
                value={regNumberInput}
                onChange={(e) => setRegNumberInput(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">University Roll Number</label>
            <input
              type="text"
              required
              value={univRollNumberInput}
              onChange={(e) => setUnivRollNumberInput(e.target.value)}
              placeholder="e.g. UNIVERSITY-001"
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Institute Email Address</label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              required
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
              <input
                type="text"
                required
                value={bloodGroupInput}
                onChange={(e) => setBloodGroupInput(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Section</label>
              <input
                type="text"
                required
                value={sectionInput}
                onChange={(e) => setSectionInput(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-photo" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Profile Photo URL (optional)</label>
            <input
              id="profile-photo"
              type="text"
              inputMode="url"
              aria-describedby="profile-photo-help"
              value={photoUrlInput}
              onChange={(e) => setPhotoUrlInput(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p id="profile-photo-help" className="mt-1.5 text-slate-500 dark:text-slate-400">Leave unchanged or blank to keep your current photo. No photo is needed to save personal details.</p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </GlassModal>
    </motion.div>
  );
};
