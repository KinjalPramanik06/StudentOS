import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { authLoginSchema } from '../lib/validation';
import { ThemeToggle } from '../components/common/ThemeToggle';


export const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const loginWithEmail = useAppStore((state) => state.loginWithEmail);
  const navigate = useNavigate();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      const parsed = authLoginSchema.parse({ email, password });
      await loginWithEmail(parsed.email, parsed.password);
      navigate('/dashboard', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in failed.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 dark:text-white flex items-center justify-center px-4 pb-6 pt-24">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6"><ThemeToggle /></div>
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white/90 dark:border-white/15 dark:bg-slate-900/75 p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold mt-3">StudentOS Portal</h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Your student and academic workspace</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            Email
            <span className="relative block mt-1"><Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white dark:border-white/15 dark:bg-slate-950/70 pl-10 pr-3 py-2.5 text-sm text-slate-900 dark:text-white focus-visible:outline-2 focus-visible:outline-blue-500" />
            </span>
          </label>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            Password
            <span className="relative block mt-1"><Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white dark:border-white/15 dark:bg-slate-950/70 pl-10 pr-11 py-2.5 text-sm text-slate-900 dark:text-white focus-visible:outline-2 focus-visible:outline-blue-500" />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 focus-visible:outline-2 focus-visible:outline-blue-400">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </span>
          </label>
          {error && <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200 p-3 text-xs">{error}</p>}
          <button type="submit" disabled={pending} className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-2.5 font-bold text-sm text-white flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
            {pending ? 'Signing in…' : 'Sign in'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        <p className="mt-5 border-t border-slate-200 dark:border-white/10 pt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Need an account or a password reset? Contact your administrator.
        </p>
      </div>
    </main>
  );
};
