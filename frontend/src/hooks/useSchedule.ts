import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { TimetableSlot } from '../types';

export function useSchedule() {
  const timetable = useAppStore((state) => state.timetable);
  const currentDate = useAppStore((state) => state.currentDate);
  const user = useAppStore((state) => state.user);
  const activeSemester = useAppStore((state) => state.activeSemester);
  const setActiveSemester = useAppStore((state) => state.setActiveSemester);

  // Single source of truth for filtering timetable by active semester & student
  const semesterTimetable = useMemo(() => {
    return timetable.filter((s) => {
      const matchesStudent = !s.studentId || s.studentId === user?.uid;
      if (!matchesStudent) return false;

      if (s.semester) {
        return s.semester === activeSemester;
      }
      return activeSemester === 2;
    });
  }, [timetable, activeSemester, user?.uid]);

  // Today's slots for current day
  const todayName = dayjs(currentDate).format('dddd');
  const todaySlots = useMemo(() => {
    return semesterTimetable.filter(
      (s) => s.day.toLowerCase() === todayName.toLowerCase()
    );
  }, [semesterTimetable, todayName]);

  const getSlotForDayAndTime = (day: string, timeSlot: string): TimetableSlot | undefined => {
    return semesterTimetable.find(
      (s) => s.day.toLowerCase() === day.toLowerCase() && s.timeSlot === timeSlot
    );
  };

  return {
    activeSemester,
    setActiveSemester,
    semesterTimetable,
    todaySlots,
    todayName,
    getSlotForDayAndTime,
  };
}
