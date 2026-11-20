/**
 * localDataService.ts
 *
 * MongoDB API adapter preserving the original store-facing function names.
 * The server resolves shared baselines and account-specific copies.
 * Mutations update Zustand after successful writes; useDataSync refreshes
 * admin publications for other open clients.
 */

import * as storage from './storageService';
import { DEFAULT_ACADEMIC_CALENDAR } from '../data/defaultAcademicCalendar';
import {
  UserProfile,
  Subject,
  TimetableSlot,
  AttendanceRecord,
  AttendanceLedgerEntry,
  MarksRecord,
  SemesterResult,
  Holiday,
  CalendarEvent,
  Assignment,
  Notice,
  AcademicSemester,
} from '../types';

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

// The server seeds a new MongoDB database once at startup.
export const seedInitialDatabaseIfEmpty = async (): Promise<void> => {};

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export const getAllStudents = () => storage.getAll<UserProfile>('students');
export const getSubjects = () => storage.getAll<Subject>('subjects');
export const getTimetable = () => storage.getAll<TimetableSlot>('timetable');
export const getAttendance = () => storage.getAll<AttendanceRecord>('attendance');
export const getAttendanceLedger = () => storage.getAll<AttendanceLedgerEntry>('attendanceLedger');
export const getHolidays = () => storage.getAll<Holiday>('holidays');
export const getCalendarEvents = () => storage.getAll<CalendarEvent>('calendarEvents');
export const getNotices = () => storage.getAll<Notice>('notices');

export const getMarks = (studentId: string) =>
  storage.find<MarksRecord>('marks', (m) => m.studentId === studentId);

export const getSemesterResults = (studentId: string) =>
  storage.find<SemesterResult>('semesterResults', (r) => r.studentId === studentId);

// The authenticated API returns shared assignments plus this account's copies.
export const getAssignments = (_studentId?: string) => storage.getAll<Assignment>('assignments');

export const getAcademicCalendar = async (): Promise<AcademicSemester[]> => {
  const all = await storage.getAll<AcademicSemester>('academicCalendar');
  return all.sort((a, b) => a.id - b.id);
};

export const getTimeSlotsConfig = async (): Promise<string[]> => {
  const setting = await storage.read<{ key: string; value: string[] }>('settings', 'timeSlotsConfig');
  return setting?.value ?? [];
};

// ---------------------------------------------------------------------------
// User profiles
// ---------------------------------------------------------------------------

export const setUserProfile = (profile: UserProfile) => storage.create('students', profile);
export const deleteUserProfile = (uid: string) => storage.del('students', uid);

// ---------------------------------------------------------------------------
// Academic calendar / semesters
// ---------------------------------------------------------------------------

export const saveAcademicSemester = (sem: AcademicSemester) => storage.create('academicCalendar', sem);
export const deleteAcademicSemester = (id: number | string) => storage.del('academicCalendar', Number(id));

export const restoreDefaultAcademicCalendarInDb = async (): Promise<void> => {
  await storage.clear('academicCalendar');
  for (const sem of DEFAULT_ACADEMIC_CALENDAR) {
    await storage.create('academicCalendar', sem);
  }
};

/**
 * Ensures all 8 default semesters exist in the local database (adding any
 * that are missing, without touching ones already present/customized), then
 * returns the full, sorted list.
 */
export const ensureAllEightSemestersInDb = async (): Promise<AcademicSemester[]> => {
  const existing = await getAcademicCalendar();
  const existingIds = new Set(existing.map((s) => s.id));

  for (const defaultSem of DEFAULT_ACADEMIC_CALENDAR) {
    if (!existingIds.has(defaultSem.id)) {
      await storage.create('academicCalendar', defaultSem);
    }
  }

  return getAcademicCalendar();
};

export const saveTimeSlotsConfig = (slots: string[]) =>
  storage.create('settings', { key: 'timeSlotsConfig', value: slots });

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export const saveAttendanceRecord = (record: AttendanceRecord) => storage.create('attendance', record);
export const saveAttendanceLedgerEntry = (entry: AttendanceLedgerEntry) => storage.create('attendanceLedger', entry);
export const deleteAttendanceLedgerEntry = (id: string) => storage.del('attendanceLedger', id);

// ---------------------------------------------------------------------------
// Marks / semester results
// ---------------------------------------------------------------------------

export const saveMarksRecord = (record: MarksRecord) => storage.create('marks', record);
export const deleteMarksRecord = (id: string) => storage.del('marks', id);
export const saveSemesterResult = (result: SemesterResult) => storage.create('semesterResults', result);
export const deleteSemesterResult = (id: string) => storage.del('semesterResults', id);

// ---------------------------------------------------------------------------
// Assignments / notices
// ---------------------------------------------------------------------------

export const saveAssignment = (assignment: Assignment) => storage.create('assignments', assignment);
export const deleteAssignment = (id: string) => storage.del('assignments', id);
export const clearAllAssignmentsInDb = () => storage.clear('assignments');
export const saveNotice = (notice: Notice) => storage.create('notices', notice);
export const deleteNotice = (id: string) => storage.del('notices', id);
export const clearAllNoticesInDb = () => storage.clear('notices');

// ---------------------------------------------------------------------------
// Holidays
// ---------------------------------------------------------------------------

export const saveHoliday = (holiday: Holiday) => storage.create('holidays', holiday);
export const deleteHoliday = (holidayId: string) => storage.del('holidays', holidayId);
export const clearAllHolidaysInDb = () => storage.clear('holidays');

// ---------------------------------------------------------------------------
// Calendar events
// ---------------------------------------------------------------------------

export const saveCalendarEvent = (event: CalendarEvent) => storage.create('calendarEvents', event);
export const deleteCalendarEvent = (eventId: string) => storage.del('calendarEvents', eventId);

// ---------------------------------------------------------------------------
// Subjects / timetable
// ---------------------------------------------------------------------------

export const saveSubject = (subject: Subject) => storage.create('subjects', subject);
export const deleteSubject = (subjectId: string) => storage.del('subjects', subjectId);
export const clearAllSubjectsInDb = () => storage.clear('subjects');
export const saveTimetableSlot = (slot: TimetableSlot) => storage.create('timetable', slot);
export const deleteTimetableSlot = (slotId: string) => storage.del('timetable', slotId);

// ---------------------------------------------------------------------------
// Bulk operations
// ---------------------------------------------------------------------------

export const massDeleteAcademicData = async (): Promise<void> => {
  await storage.clear('subjects');
  await storage.clear('timetable');
  await storage.clear('calendarEvents');
};
