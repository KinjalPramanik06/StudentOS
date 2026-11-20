import type { CalendarEvent, Holiday, SemesterInfo } from '../types';

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function calendarActivity(info: SemesterInfo, today: string, events: CalendarEvent[], holidays: Holiday[]): string {
  if (info.status !== 'Semester Active') return info.status;
  const onDate = (event: { date: string; endDate?: string }) =>
    event.date <= today && today <= (event.endDate || event.date);
  const scheduled = [
    ...holidays.filter(onDate),
    ...events.filter(onDate).sort((a, b) => Number(b.category === 'Exam') - Number(a.category === 'Exam')),
  ];
  return [...new Set(scheduled.map((event) => event.title))].join(' · ') || 'No calendar events today';
}
