import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  MapPin,
  User,
  Coffee,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useSchedule } from '../hooks/useSchedule';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { formatTimeSlot12h } from '../utils/formatTime';

export const SchedulePage: React.FC = () => {
  const { activeSemester, setActiveSemester, todaySlots, todayName } = useSchedule();
  const navigate = useNavigate();

  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayClasses = todaySlots;

  // Calculate period status and remaining minutes
  const getPeriodMeta = (timeSlot: string) => {
    const [startStr, endStr] = timeSlot.split('-');
    let [sH, sM] = startStr.split(':').map(Number);
    let [eH, eM] = endStr.split(':').map(Number);

    if (sH >= 1 && sH <= 7) sH += 12;
    if (eH >= 1 && eH <= 7) eH += 12;

    const startTime = dayjs().hour(sH).minute(sM).second(0);
    const endTime = dayjs().hour(eH).minute(eM).second(0);

    if (now.isAfter(endTime)) {
      return { status: 'completed', remainingMinutes: 0 };
    }
    if (now.isAfter(startTime) && now.isBefore(endTime)) {
      const diffSecs = endTime.diff(now, 'second');
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      return {
        status: 'current',
        remainingText: `${mins}m ${secs < 10 ? '0' : ''}${secs}s remaining`,
      };
    }
    return { status: 'upcoming', remainingMinutes: startTime.diff(now, 'minute') };
  };

  return (
    <div className="space-y-6">
      {/* Schedule Header */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300" /> Today's Live Schedule • {todayName}
          </div>
          <h1 className="text-2xl font-black tracking-tight">Real-Time Class Timeline</h1>
          <p className="text-xs text-blue-100 mt-1">
            StudentOS • Semester {activeSemester} • Synchronized with Dashboard Schedule
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-right">
            <div className="text-xl font-mono font-bold">{now.format('hh:mm:ss A')}</div>
            <div className="text-[10px] text-blue-200">{now.format('MMMM D, YYYY')}</div>
          </div>
        </div>
      </div>

      {/* Semester Selection Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <Calendar className="w-4 h-4 text-indigo-500" /> Select Active Semester Schedule:
        </div>
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold overflow-x-auto max-w-full custom-scrollbar">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <button
              key={sem}
              onClick={() => setActiveSemester(sem)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSemester === sem
                  ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semester {sem}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule List Timeline */}
      <div className="space-y-4">
        {todayClasses.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
            <Clock className="w-10 h-10 text-indigo-400 mx-auto opacity-80" />
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
              No Scheduled Classes for Semester {activeSemester} Today ({todayName})
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You have no active classes scheduled for this semester on {todayName}. Select another semester above or check the full timetable.
            </p>
            <button
              onClick={() => navigate('/timetable')}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition shadow-sm"
            >
              View Full Timetable Grid
            </button>
          </div>
        ) : (
          todayClasses.map((slot, index) => {
            const meta = getPeriodMeta(slot.timeSlot);
            const isBreak = slot.type === 'Break';

            return (
              <motion.div
                key={slot.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-5 rounded-2xl border transition-all ${
                  meta.status === 'current'
                    ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500'
                    : meta.status === 'completed'
                    ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 opacity-60'
                    : isBreak
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-xs min-w-[90px] ${
                        meta.status === 'current'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                          : meta.status === 'completed'
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          : isBreak
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Clock className="w-4 h-4 mb-1" />
                      <span className="text-center">{formatTimeSlot12h(slot.timeSlot)}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {slot.subjectName}
                        </h3>
                        {meta.status === 'current' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                            LIVE NOW
                          </span>
                        )}
                        {meta.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-semibold">
                            Finished
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-blue-500" /> Faculty: {slot.faculty}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" /> Room: {slot.room}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                          {slot.type} ({slot.credits} Credits)
                        </span>
                      </div>

                      {meta.status === 'current' && meta.remainingText && (
                        <div className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> Countdown: {meta.remainingText}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isBreak && (
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => navigate(`/subjects?code=${slot.subjectCode}`)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Syllabus
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
