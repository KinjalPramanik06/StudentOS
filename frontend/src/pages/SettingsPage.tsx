import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Download, RefreshCw, Lock, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useSound } from '../hooks/useSound';
import { useToast } from '../context/ToastContext';
import { changePassword } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { exportToFile, importAll, readBackupFile } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';

export const SettingsPage: React.FC = () => {
  const { resetToDefaultData, fetchData, user, logout } = useAppStore();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { playClick, playSuccess, playPop } = useSound();
  const { addToast } = useToast();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const importInput = useRef<HTMLInputElement>(null);

  const handleExportJson = async () => {
    playPop();
    try {
      await exportToFile();
      addToast('StudentOS backup downloaded.', 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Export failed.', 'error');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !confirm('Import this backup? Existing shared academic records will be replaced. Account passwords and roles stay unchanged.')) return;
    try {
      await importAll(await readBackupFile(file));
      await fetchData();
      addToast('Academic records imported.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Import failed.', 'error');
    }
  };

  const handleResetData = async () => {
    playClick();
    if (confirm('Clear all academic records and personal copies? The two account profiles and passwords will remain.')) {
      try {
        await resetToDefaultData();
        playSuccess();
        addToast('Shared academic data reset.', 'success');
      } catch (error) {
        addToast(error instanceof Error ? error.message : 'Reset failed.', 'error');
      }
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await changePassword(oldPassword, newPassword);
      await logout().catch(() => undefined);
      setOldPassword('');
      setNewPassword('');
      playSuccess();
      navigate('/login', { replace: true });
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Password could not be changed.', 'error');
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
      className="space-y-6 max-w-4xl mx-auto pb-12"
    >
      {/* Settings Header */}
      <motion.div
        variants={cardVariants}
        className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative overflow-hidden"
      >
        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Settings className="w-4 h-4 text-amber-500" /> System Preferences & Options
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Portal Configuration Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage account security, export academic records, or clear academic data
        </p>
      </motion.div>

      <motion.section variants={cardVariants} aria-labelledby="display-mode-heading" className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
        <h3 id="display-mode-heading" className="font-bold text-slate-900 dark:text-white text-base">Display mode</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">Choose day or night mode for the whole portal. Your choice is saved in this browser.</p>
        <div role="group" aria-label="Display mode" className="grid grid-cols-2 gap-3 max-w-md">
          {([{ value: 'light', label: 'Day mode', icon: Sun }, { value: 'dark', label: 'Night mode', icon: Moon }] as const).map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" aria-pressed={resolvedTheme === value} onClick={() => setTheme(value)} className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${resolvedTheme === value ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-300' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />{label}
              {resolvedTheme === value && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Security Section */}
      <motion.div
        variants={cardVariants}
        className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4"
      >
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-500" /> Password & Security
        </h3>

        <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs max-w-md">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={10}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-500/20"
          >
            Update Account Password
          </button>
        </form>
      </motion.div>

      {/* Export & Data Management */}
      <motion.div
        variants={cardVariants}
        className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4"
      >
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-500" /> Data Backup & Database Maintenance
        </h3>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportJson}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-md shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" /> Export Student Backup (JSON)
          </button>
          {user?.role === 'admin' && <>
            <input ref={importInput} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" aria-label="Import StudentOS backup" />
            <button type="button" onClick={() => importInput.current?.click()} className="px-4 py-2.5 rounded-xl border border-blue-300 text-blue-700 dark:text-blue-300 text-xs font-bold">Import backup</button>
          </>}
          {user?.role === 'admin' && <button
            onClick={handleResetData}
            className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reset shared academic data
          </button>
          }
        </div>
      </motion.div>
    </motion.div>
  );
};
