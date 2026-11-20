import type { AttendanceRecord } from '../types';

export const MIN_SUBJECT_ATTENDANCE_PERCENT = 75;

// Records created before semester tracking belonged to the original second semester.
export const attendanceSemester = (record: AttendanceRecord): number => Number(record.semester ?? 2);

export function getSubjectAttendance(record: AttendanceRecord) {
  const held = record.theoryHeld + record.labHeld;
  const present = record.theoryPresent + record.labPresent;
  const percentage = held > 0 ? (present / held) * 100 : null;

  return {
    held,
    present,
    percentage,
    belowMinimum: percentage !== null && percentage < MIN_SUBJECT_ATTENDANCE_PERCENT,
  };
}

export function getAttendancePlan(held: number, present: number) {
  if (held === 0) return { canMiss: 0, needToAttend: 0 };

  const target = MIN_SUBJECT_ATTENDANCE_PERCENT / 100;
  const percentage = (present / held) * 100;
  if (percentage >= MIN_SUBJECT_ATTENDANCE_PERCENT) {
    return { canMiss: Math.max(0, Math.floor(present / target - held)), needToAttend: 0 };
  }

  return {
    canMiss: 0,
    needToAttend: Math.max(0, Math.ceil((target * held - present) / (1 - target))),
  };
}
