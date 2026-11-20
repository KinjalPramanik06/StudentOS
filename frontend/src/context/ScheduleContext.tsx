import React, { createContext, useContext } from 'react';
import { useSchedule } from '../hooks/useSchedule';
import { TimetableSlot } from '../types';

export interface ScheduleContextType {
  activeSemester: number;
  setActiveSemester: (semester: number) => void;
  semesterTimetable: TimetableSlot[];
  todaySlots: TimetableSlot[];
  todayName: string;
  getSlotForDayAndTime: (day: string, timeSlot: string) => TimetableSlot | undefined;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const schedule = useSchedule();

  return <ScheduleContext.Provider value={schedule}>{children}</ScheduleContext.Provider>;
};

export const useScheduleContext = (): ScheduleContextType => {
  const context = useContext(ScheduleContext);
  if (context) {
    return context;
  }
  // Fallback to useSchedule directly
  return useSchedule();
};

