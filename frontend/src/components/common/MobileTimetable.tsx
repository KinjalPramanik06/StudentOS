import React, { useState } from 'react';
import { Clock, MapPin, ChevronRight } from 'lucide-react';
import type { TimetableSlot } from '../../types';
import { formatTimeSlot12h } from '../../utils/formatTime';

type Props = { slots: TimetableSlot[]; today: string; onSelect: (slot: TimetableSlot) => void };

export function MobileTimetable({ slots, today, onSelect }: Props) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  for (const day of ['Saturday', 'Sunday']) if (slots.some((slot) => slot.day === day)) days.push(day);
  const [selected, setSelected] = useState(days.includes(today) ? today : 'Monday');
  const classes = slots.filter((slot) => slot.day === selected).sort((a, b) => {
    const minutes = (time: string) => {
      const match = time.match(/(\d{1,2}):(\d{2})/);
      if (!match) return 0;
      const hour = Number(match[1]);
      return (hour < 8 ? hour + 12 : hour) * 60 + Number(match[2]);
    };
    return minutes(a.timeSlot) - minutes(b.timeSlot);
  });

  return <section data-mobile-timetable className="md:hidden space-y-3">
    <div role="group" aria-label="Timetable day" className="flex gap-1.5 overflow-x-auto pb-1">
      {days.map((day) => <button key={day} aria-pressed={selected === day} onClick={() => setSelected(day)}
        className={`flex-1 min-w-[48px] min-h-11 rounded-xl text-xs font-bold transition ${selected === day ? 'bg-blue-600 text-white shadow-sm' : 'bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800'}`}>
        {day.slice(0, 3)}
      </button>)}
    </div>
    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
      <h2 className="font-bold text-slate-900 dark:text-white">{selected}'s classes</h2>
      <span>{classes.length} {classes.length === 1 ? 'class' : 'classes'}</span>
    </div>
    {classes.length === 0 ? <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 text-center">
      <Clock className="w-5 h-5 text-blue-500 mx-auto mb-2" />
      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">No classes scheduled</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose another day to view its classes.</p>
    </div> : classes.map((slot) => <button key={slot.id} onClick={() => onSelect(slot)}
      className={`w-full p-4 rounded-2xl text-left bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 border-l-4 ${slot.type === 'Lab' ? 'border-l-purple-500' : 'border-l-blue-500'} shadow-sm focus-visible:outline-2 focus-visible:outline-blue-500`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatTimeSlot12h(slot.timeSlot)}</span>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{slot.type}</span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="min-w-0"><p className="font-bold text-sm leading-snug text-slate-900 dark:text-white">{slot.subjectName || slot.subjectCode}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{slot.faculty || 'Faculty to be confirmed'}</p></div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </div>
      <span className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"><MapPin className="w-3 h-3" />{slot.room || 'Room to be confirmed'}</span>
    </button>)}
  </section>;
}
