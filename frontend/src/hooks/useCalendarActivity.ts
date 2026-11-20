import { useAppStore } from '../store/useAppStore';
import { calendarActivity } from '../utils/calendarActivity';
import type { SemesterInfo } from '../types';

export function useCalendarActivity(info?: SemesterInfo) {
  const storedInfo = useAppStore((state) => state.semesterInfo);
  const date = useAppStore((state) => state.currentDate);
  const events = useAppStore((state) => state.calendarEvents);
  const holidays = useAppStore((state) => state.holidays);
  return calendarActivity(info || storedInfo, date, events, holidays);
}
