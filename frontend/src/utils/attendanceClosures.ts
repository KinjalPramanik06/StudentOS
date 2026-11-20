import type { CalendarEvent, Holiday } from '../types';

export type NonCountingAttendanceStatus = 'Off' | 'Event' | 'Holiday';

const inRange = (date: string, start: string, end?: string) => date >= start && date <= (end || start);

export function calendarClosureStatus(date: string, events: CalendarEvent[], holidays: Holiday[]): Exclude<NonCountingAttendanceStatus, 'Off'> | null {
  if (holidays.some((holiday) => inRange(date, holiday.date, holiday.endDate))) return 'Holiday';
  if (events.some((event) => ['Event', 'Exam', 'Holiday'].includes(event.category) && inRange(date, event.date, event.endDate))) {
    return events.some((event) => event.category === 'Holiday' && inRange(date, event.date, event.endDate)) ? 'Holiday' : 'Event';
  }
  return null;
}

export function isCountingAttendanceStatus(status: string): status is 'Present' | 'Absent' {
  return status === 'Present' || status === 'Absent';
}
