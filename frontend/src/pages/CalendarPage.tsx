import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Palmtree, ChevronLeft, ChevronRight, Plus, Sparkles, Filter, Clock, X, Trash2, Settings, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useSound } from '../hooks/useSound';
import { GlassModal } from '../components/common/GlassModal';
import { SemesterProgressBar } from '../components/common/SemesterProgressBar';
import dayjs from 'dayjs';
import { useCalendarActivity } from '../hooks/useCalendarActivity';

export const CalendarPage: React.FC = () => {
  const { calendarEvents, holidays, addCalendarEvent, deleteCalendarEvent, deleteHoliday, user, semesterInfo, currentDate } = useAppStore();
  const activityLabel = useCalendarActivity();
  const { playPop, playSuccess, playClick } = useSound();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Academic' | 'Holidays'>('Academic');
  const [currentMonth, setCurrentMonth] = useState(() => dayjs(currentDate).startOf('month'));
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [showAllMobileEvents, setShowAllMobileEvents] = useState(false);
  useEffect(() => { setSelectedDate(currentDate); }, [currentDate]);
  useEffect(() => { setCurrentMonth(dayjs(currentDate).startOf('month')); }, [currentDate]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Academic' | 'Exam' | 'Registration' | 'Event'>('Exam');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  // Month grid calculations
  const startOfMonth = currentMonth.startOf('month');
  const daysInMonth = currentMonth.daysInMonth();
  const startDayOfWeek = startOfMonth.day(); // 0 is Sunday

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyPrefixSlots = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const prevMonth = () => {
    playClick();
    setCurrentMonth(currentMonth.subtract(1, 'month'));
    setSelectedDate(currentMonth.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'));
  };
  const nextMonth = () => {
    playClick();
    setCurrentMonth(currentMonth.add(1, 'month'));
    setSelectedDate(currentMonth.add(1, 'month').startOf('month').format('YYYY-MM-DD'));
  };

  const items = activeTab === 'Academic' ? calendarEvents : holidays;

  const filteredItems = items.filter((it) => {
    if (selectedCategory === 'All') return true;
    return it.category === selectedCategory;
  });

  const getEventsForDate = (dayNum: number) => {
    const dateStr = currentMonth.date(dayNum).format('YYYY-MM-DD');
    return filteredItems.filter((item) => {
      if (item.date === dateStr) return true;
      if (item.endDate && item.date <= dateStr && item.endDate >= dateStr) return true;
      return false;
    });
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
      {/* Calendar Header Banner */}
      <motion.div
        variants={cardVariants}
        className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-blue-500" /> Institute Academic Operations
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Academic & Holiday Calendar
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Key Deadlines, CIA Exams & Holiday Schedules
            </p>
          </div>

          {/* Tab Toggle & Add Event */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                playPop();
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>

            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  playClick();
                  setActiveTab('Academic');
                  setSelectedCategory('All');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'Academic'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarIcon className="w-4 h-4" /> Academic Events
              </button>
              <button
                onClick={() => {
                  playClick();
                  setActiveTab('Holidays');
                  setSelectedCategory('All');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'Holidays'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Palmtree className="w-4 h-4 text-emerald-500" /> Holiday Calendar
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Live Semester Detection Banner */}
      <motion.div
        data-calendar-status
        variants={cardVariants}
        className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-slate-900/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-slate-900/60 backdrop-blur-xl border border-blue-500/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wide ${
                semesterInfo.status === 'Semester Active'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
            >
              {semesterInfo.status}
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">
              Session: {semesterInfo.academicSession}
            </span>
          </div>

          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{semesterInfo.semesterName}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              ({semesterInfo.fullName})
            </span>
          </h3>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {semesterInfo.startDate} → {semesterInfo.endDate} ({semesterInfo.totalDays} days total)
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-[280px]">
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-500 dark:text-slate-400">Current Semester Progress</span>
              <span className="text-blue-600 dark:text-blue-400">{semesterInfo.progressPercentage}%</span>
            </div>
            <SemesterProgressBar
              percentage={semesterInfo.progressPercentage}
              showLabels
              showPhaseBadges
              activityLabel={activityLabel}
              isBreak={semesterInfo.status === 'Semester Break'}
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
              <span>{semesterInfo.daysCompleted} days completed</span>
              <span>{semesterInfo.daysRemaining} days remaining</span>
            </div>
          </div>

          {(user?.role === 'admin' || user?.dataAccess === 'Full Read & Write') && (
            <button
              onClick={() => {
                playClick();
                navigate('/admin/calendar');
              }}
              className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-xs transition border border-slate-200 dark:border-slate-700 shrink-0 flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-blue-500" />
              <span>Admin Settings</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Calendar Navigation & Filters */}
      <motion.div
        variants={cardVariants}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs"
      >
        <div className="flex flex-wrap justify-center items-center gap-3 max-w-full">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base min-w-[150px] text-center">
            {currentMonth.format('MMMM YYYY')}
          </h3>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => { setCurrentMonth(dayjs(currentDate).startOf('month')); setSelectedDate(currentDate); }} className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold">Today</button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {activeTab === 'Academic' ? (
            ['All', 'Exam', 'Registration', 'Event', 'Lecture'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))
          ) : (
            ['All', 'National', 'College', 'Festival', 'Vacation'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))
          )}
        </div>
      </motion.div>

      {/* Month Calendar Grid */}
      <motion.div
        variants={cardVariants}
        className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs"
      >
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 gap-2">
          {emptyPrefixSlots.map((_, idx) => (
            <div key={`empty-${idx}`} className="min-h-[52px] md:min-h-[90px] rounded-2xl bg-slate-50/50 dark:bg-slate-800/20" />
          ))}

          {daysArray.map((dayNum) => {
            const dayEvents = getEventsForDate(dayNum);
            const isToday = currentMonth.date(dayNum).format('YYYY-MM-DD') === currentDate;

            return (
              <div
                key={dayNum}
                data-calendar-date={currentMonth.date(dayNum).format('YYYY-MM-DD')}
                aria-current={isToday ? 'date' : undefined}
                className={`mobile-calendar-day relative min-h-[52px] md:min-h-[90px] p-1 md:p-2 rounded-xl md:rounded-2xl border transition-all flex flex-col justify-between ${
                  isToday
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-white/50 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <button className="absolute inset-0 md:hidden rounded-xl focus-visible:outline-2 focus-visible:outline-blue-500" aria-label={`${currentMonth.date(dayNum).format('MMMM D, YYYY')}, ${dayEvents.length} events`} aria-pressed={selectedDate === currentMonth.date(dayNum).format('YYYY-MM-DD')} onClick={() => { setSelectedDate(currentMonth.date(dayNum).format('YYYY-MM-DD')); setShowAllMobileEvents(false); }} />
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>
                </div>

                <div className="md:hidden flex gap-1 px-1 pb-1 pointer-events-none" aria-hidden="true">{dayEvents.slice(0, 3).map((event) => <span key={event.id} className={`w-1.5 h-1.5 rounded-full ${activeTab === 'Holidays' ? 'bg-emerald-500' : event.category === 'Exam' ? 'bg-rose-500' : 'bg-blue-500'}`} />)}</div>
                <div className="hidden md:block space-y-1 mt-1 overflow-y-auto max-h-[60px] custom-scrollbar">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate ${
                        activeTab === 'Holidays'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : ev.category === 'Exam'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : ev.category === 'Registration'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      }`}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Events List Cards */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-bold text-slate-900 dark:text-white">{showAllMobileEvents ? 'All events' : dayjs(selectedDate).format('dddd, MMM D')}</h2>
          <button onClick={() => setShowAllMobileEvents(!showAllMobileEvents)} className="min-h-10 text-xs font-bold text-blue-600 dark:text-blue-400">{showAllMobileEvents ? 'Selected day' : 'Show all events'}</button>
        </div>
        {!showAllMobileEvents && filteredItems.length > 0 && !filteredItems.some((item) => item.date <= selectedDate && selectedDate <= (item.endDate || item.date)) && <p className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-xs text-slate-500 dark:text-slate-400">No events on this day. Select a marked date or add an event.</p>}
      </div>
      {filteredItems.length === 0 ? (
        <motion.div
          variants={cardVariants}
          className="p-8 text-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-dashed border-slate-200 dark:border-slate-800"
        >
          <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No {activeTab === 'Academic' ? 'Academic Events or Exams' : 'Holidays'} Listed
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {activeTab === 'Academic'
              ? 'Click "Add Event" above to create an event entry.'
              : 'No holidays listed for this filter.'}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item: any) => (
            <div
              key={item.id}
              className={`${showAllMobileEvents || (item.date <= selectedDate && selectedDate <= (item.endDate || item.date)) ? '' : 'hidden md:block'} p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative group hover:border-blue-500/40 transition-all`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {item.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">{item.date}</span>
                  {activeTab === 'Academic' ? (
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        deleteCalendarEvent(item.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 transition"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        deleteHoliday(item.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 transition"
                      title="Delete holiday"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-2">{item.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.description}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Add Event Glass Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Academic Event / Exam"
        maxWidth="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!title.trim() || !date) return;
            await addCalendarEvent({
              id: 'ev_' + Date.now(),
              studentId: user?.uid,
              title: title.trim(),
              category,
              date,
              endDate: endDate || undefined,
              description: description.trim() || `${category} schedule entry`,
            });
            playSuccess();
            setTitle('');
            setDate('');
            setEndDate('');
            setDescription('');
            setIsModalOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CIA 1 Assessment Week"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Exam">Exam / CIA</option>
              <option value="Academic">Academic</option>
              <option value="Registration">Registration</option>
              <option value="Event">Event</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Additional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition"
            >
              Save Event
            </button>
          </div>
        </form>
      </GlassModal>
    </motion.div>
  );
};
