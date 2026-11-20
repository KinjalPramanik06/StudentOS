import { create } from 'zustand';
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
  SemesterInfo,
} from '../types';
import { DEFAULT_ACADEMIC_CALENDAR } from '../data/defaultAcademicCalendar';
import { DEFAULT_TIME_SLOTS } from '../data/defaultTimeSlots';
import { getSemesterInfo } from '../utils/academicCalendarEngine';
import { localDateKey } from '../utils/calendarActivity';
import * as dbServices from '../services/localDataService';
import * as auth from '../services/authService';
import { api } from '../services/storageService';

export type ThemeMode = 'light' | 'dark' | 'system';

const initialUser: UserProfile | null = null;

const getInitialSemester = (user: UserProfile | null): number => {
  if (!user?.semester) return 1;
  const match = user.semester.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
};

interface AppState {
  // Auth state
  user: UserProfile | null;
  isAuthenticated: boolean;
  authReady: boolean;
  theme: ThemeMode;
  isSearchOpen: boolean;

  // Schedule state slice
  activeSemester: number;

  // Cached collections
  allStudents: UserProfile[];
  subjects: Subject[];
  timetable: TimetableSlot[];
  timeSlots: string[];
  attendance: AttendanceRecord[];
  attendanceLedger: AttendanceLedgerEntry[];
  marks: MarksRecord[];
  semesterResults: SemesterResult[];
  holidays: Holiday[];
  calendarEvents: CalendarEvent[];
  assignments: Assignment[];
  notices: Notice[];
  academicCalendar: AcademicSemester[];
  semesterInfo: SemesterInfo;
  currentDate: string;
  refreshDate: () => void;
  isLoading: boolean;
  dataError: string | null;

  // Actions
  restoreSession: () => Promise<void>;
  setActiveSemester: (semester: number) => void;
  saveAcademicSemester: (sem: AcademicSemester) => Promise<void>;
  deleteAcademicSemester: (id: number | string) => Promise<void>;
  restoreDefaultAcademicCalendar: () => Promise<void>;
  syncAllEightSemestersToDatabase: () => Promise<void>;
  updateTimeSlots: (slots: string[]) => Promise<void>;
  setTheme: (theme: ThemeMode) => void;
  toggleSearch: (isOpen?: boolean) => void;
  loginWithEmail: (email: string, password?: string, requestedRole?: 'student' | 'admin') => Promise<UserProfile>;
  updateUserProfile: (updatedProfile: UserProfile) => Promise<void>;
  logout: () => Promise<void>;

  // Data Actions & Sync
  fetchData: (background?: boolean) => Promise<void>;
  updateAttendance: (record: AttendanceRecord) => Promise<void>;
  resetSubjectAttendance: (subjectCode: string, studentId?: string, semesterId?: number) => Promise<void>;
  resetAllAttendance: (studentId?: string, semesterId?: number) => Promise<void>;
  addAttendanceLedgerEntry: (entry: AttendanceLedgerEntry) => Promise<void>;
  deleteAttendanceLedgerEntry: (id: string) => Promise<void>;
  updateMarks: (record: MarksRecord) => Promise<void>;
  addMarksRecord: (record: MarksRecord) => Promise<void>;
  deleteMarksRecord: (id: string) => Promise<void>;
  addSemesterResult: (result: SemesterResult) => Promise<void>;
  updateSemesterResult: (result: SemesterResult) => Promise<void>;
  deleteSemesterResult: (id: string) => Promise<void>;
  addAssignment: (assignment: Assignment) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  submitAssignment: (assignmentId: string, fileName: string, fileUrl: string) => Promise<void>;
  addNotice: (notice: Notice) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;
  addHoliday: (holiday: Holiday) => Promise<void>;
  updateHoliday: (holiday: Holiday) => Promise<void>;
  deleteHoliday: (holidayId: string) => Promise<void>;
  clearAllHolidays: () => Promise<void>;
  addCalendarEvent: (event: CalendarEvent) => Promise<void>;
  updateCalendarEvent: (event: CalendarEvent) => Promise<void>;
  deleteCalendarEvent: (eventId: string) => Promise<void>;
  clearAllCalendarEvents: () => Promise<void>;
  addStudent: (student: UserProfile) => Promise<void>;
  deleteStudent: (uid: string) => Promise<void>;
  addSubject: (subject: Subject) => Promise<void>;
  updateSubject: (subject: Subject) => Promise<void>;
  deleteSubject: (subjectId: string) => Promise<void>;
  addTimetableSlot: (slot: TimetableSlot) => Promise<void>;
  updateTimetableSlot: (slot: TimetableSlot) => Promise<void>;
  deleteTimetableSlot: (slotId: string) => Promise<void>;
  massDeleteAcademicData: () => Promise<void>;
  resetToDefaultData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: initialUser,
  isAuthenticated: false,
  authReady: false,
  theme: (() => {
    try {
      const saved = localStorage.getItem('theme') || localStorage.getItem('studentos_theme');
      return saved === 'dark' || saved === 'system' ? saved : 'light';
    } catch {
      return 'light';
    }
  })(),
  isSearchOpen: false,

  activeSemester: getInitialSemester(initialUser),

  allStudents: [],
  subjects: [],
  timetable: [],
  timeSlots: DEFAULT_TIME_SLOTS,
  attendance: [],
  attendanceLedger: [],
  marks: [],
  semesterResults: [],
  holidays: [],
  calendarEvents: [],
  assignments: [],
  notices: [],
  academicCalendar: DEFAULT_ACADEMIC_CALENDAR,
  semesterInfo: getSemesterInfo(new Date(), DEFAULT_ACADEMIC_CALENDAR),
  currentDate: localDateKey(),
  refreshDate: () => {
    const today = localDateKey();
    if (today === get().currentDate) return;
    set({ currentDate: today, semesterInfo: getSemesterInfo(new Date(), get().academicCalendar) });
  },
  isLoading: false,
  dataError: null,

  restoreSession: async () => {
    const user = await auth.session();
    set({ user, isAuthenticated: !!user, authReady: true, activeSemester: getInitialSemester(user) });
    if (user) await get().fetchData();
  },

  setActiveSemester: (semester) => set({ activeSemester: semester }),

  saveAcademicSemester: async (sem) => {
    const calendar = get().academicCalendar;
    const exists = calendar.some((s) => s.id === sem.id);
    const updated = exists
      ? calendar.map((s) => (s.id === sem.id ? sem : s))
      : [...calendar, sem].sort((a, b) => a.id - b.id);
    const info = getSemesterInfo(new Date(), updated);
    await dbServices.saveAcademicSemester(sem);
    set({
      academicCalendar: updated,
      semesterInfo: info,
      activeSemester: info.currentSemesterId || get().activeSemester,
    });
  },

  deleteAcademicSemester: async (id) => {
    const updated = get().academicCalendar.filter((s) => s.id !== Number(id));
    const info = getSemesterInfo(new Date(), updated);
    await dbServices.deleteAcademicSemester(id);
    set({
      academicCalendar: updated,
      semesterInfo: info,
      activeSemester: info.currentSemesterId || get().activeSemester,
    });
  },

  restoreDefaultAcademicCalendar: async () => {
    const info = getSemesterInfo(new Date(), DEFAULT_ACADEMIC_CALENDAR);
    await dbServices.restoreDefaultAcademicCalendarInDb();
    set({
      academicCalendar: DEFAULT_ACADEMIC_CALENDAR,
      semesterInfo: info,
      activeSemester: info.currentSemesterId || 2,
    });
  },

  syncAllEightSemestersToDatabase: async () => {
    const synced = await dbServices.ensureAllEightSemestersInDb();
    const info = getSemesterInfo(new Date(), synced);
    set({
      academicCalendar: synced,
      semesterInfo: info,
      activeSemester: info.currentSemesterId || get().activeSemester || 2,
    });
  },

  updateTimeSlots: async (slots: string[]) => {
    await dbServices.saveTimeSlotsConfig(slots);
    set({ timeSlots: slots });
  },
  
  setTheme: (theme) => {
    try {
      localStorage.setItem('theme', theme);
      localStorage.setItem('studentos_theme', theme);
    } catch { /* Theme still works when browser storage is unavailable. */ }
    set({ theme });
  },

  toggleSearch: (isOpen) => set((state) => ({ isSearchOpen: isOpen !== undefined ? isOpen : !state.isSearchOpen })),

  loginWithEmail: async (email: string, password?: string, _requestedRole?: 'student' | 'admin') => {
    if (!password) throw new Error('Password is required.');
    const user = await auth.login(email.trim().toLowerCase(), password);
    set({ user, isAuthenticated: true, authReady: true, activeSemester: getInitialSemester(user) });
    sessionStorage.setItem('studentos_just_logged_in', 'true');
    await get().fetchData();
    return user;
  },

  updateUserProfile: async (updatedProfile: UserProfile) => {
    const { user, allStudents } = get();
    const isSelf = user?.uid === updatedProfile.uid;
    const newCurrentUser = isSelf ? updatedProfile : user;
    const updatedList = allStudents.map((s) => (s.uid === updatedProfile.uid ? updatedProfile : s));

    const saved = await dbServices.setUserProfile(updatedProfile);
    set({ user: isSelf ? saved : newCurrentUser, allStudents: updatedList.map((profile) => profile.uid === saved.uid ? saved : profile) });
  },

  logout: async () => {
    try { await auth.logout(); }
    finally {
      sessionStorage.removeItem('studentos_just_logged_in');
      set({ user: null, isAuthenticated: false, allStudents: [], attendance: [], attendanceLedger: [], marks: [], semesterResults: [], assignments: [] });
    }
  },

  fetchData: async (background = false) => {
    if (!get().user) return;
    if (!background) set({ isLoading: true, dataError: null });
    const requestUid = get().user?.uid;
    try {
          const currentUser = get().user;
          const studentId = currentUser?.uid || 'std_001';

          const [
            studentsRes,
            subjectsRes,
            timetableRes,
            attendanceRes,
            attendanceLedgerRes,
            marksRes,
            semResultsRes,
            holidaysRes,
            eventsRes,
            assignmentsRes,
            noticesRes,
            calendarRes,
            timeSlotsRes,
          ] = await Promise.all([
            dbServices.getAllStudents(),
            dbServices.getSubjects(),
            dbServices.getTimetable(),
            dbServices.getAttendance(),
            dbServices.getAttendanceLedger(),
            dbServices.getMarks(studentId),
            dbServices.getSemesterResults(studentId),
            dbServices.getHolidays(),
            dbServices.getCalendarEvents(),
            dbServices.getAssignments(studentId),
            dbServices.getNotices(),
            dbServices.getAcademicCalendar(),
            dbServices.getTimeSlotsConfig(),
          ]);

          const calInfo = getSemesterInfo(new Date(), calendarRes);
          if (get().user?.uid !== requestUid) return;
          set({
            allStudents: studentsRes.filter((profile) => profile.role === 'student'),
            subjects: subjectsRes,
            timetable: timetableRes,
            timeSlots: timeSlotsRes && timeSlotsRes.length > 0 ? timeSlotsRes : DEFAULT_TIME_SLOTS,
            attendance: attendanceRes,
            attendanceLedger: attendanceLedgerRes,
            marks: marksRes,
            semesterResults: semResultsRes,
            holidays: holidaysRes,
            calendarEvents: eventsRes,
            assignments: assignmentsRes,
            notices: noticesRes,
            academicCalendar: calendarRes,
            semesterInfo: calInfo,
            activeSemester: background ? get().activeSemester : calInfo.currentSemesterId || get().activeSemester,
            dataError: null,
          });
      
    } catch (err) {
      if (get().user?.uid === requestUid) set({ dataError: err instanceof Error ? err.message : 'Data could not be loaded.' });
    } finally {
      if (!background && get().user?.uid === requestUid) set({ isLoading: false });
    }
  },

  updateAttendance: async (record) => {
    const sem = record.semester || get().activeSemester;
    const fullRecord = { ...record, semester: sem };
    const current = get().attendance;
    const exists = current.some(
      (a) => a.id === fullRecord.id || (a.studentId === fullRecord.studentId && a.subjectCode === fullRecord.subjectCode && Number(a.semester || 2) === Number(sem))
    );
    const updated = exists
      ? current.map((a) =>
          a.id === fullRecord.id || (a.studentId === fullRecord.studentId && a.subjectCode === fullRecord.subjectCode && Number(a.semester || 2) === Number(sem))
            ? fullRecord
            : a
        )
      : [...current, fullRecord];
    await dbServices.saveAttendanceRecord(fullRecord);
    set({ attendance: updated });
  },

  resetSubjectAttendance: async (subjectCode, studentId, semesterId) => {
    const targetStudentId = studentId || get().user?.uid || 'std_001';
    const sem = semesterId || get().activeSemester;
    const currentAtt = get().attendance;
    const targetRecord = currentAtt.find(
      (a) => a.studentId === targetStudentId && a.subjectCode === subjectCode && Number(a.semester || 2) === Number(sem)
    );

    if (targetRecord) {
      const resetRecord: AttendanceRecord = {
        ...targetRecord,
        theoryHeld: 0,
        theoryPresent: 0,
        labHeld: 0,
        labPresent: 0,
        semester: sem,
        lastUpdated: new Date().toISOString().substring(0, 10),
      };

      const updatedAtt = currentAtt.map((a) => (a.id === resetRecord.id ? resetRecord : a));

      // Create a reset ledger entry
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const ledgerEntry: AttendanceLedgerEntry = {
        id: `led_reset_${Date.now()}`,
        studentId: targetStudentId,
        subjectCode: targetRecord.subjectCode,
        subjectName: targetRecord.subjectName,
        date: nowStr,
        sessionType: 'Theory',
        status: 'Reset',
        remarks: `Subject attendance reset to 0 (Semester ${sem})`,
        semester: sem,
      };

      const updatedLedger = [ledgerEntry, ...get().attendanceLedger];

      await dbServices.saveAttendanceRecord(resetRecord);
      await dbServices.saveAttendanceLedgerEntry(ledgerEntry);
      set({ attendance: updatedAtt, attendanceLedger: updatedLedger });
    }
  },

  resetAllAttendance: async (studentId, semesterId) => {
    const targetStudentId = studentId || get().user?.uid || 'std_001';
    const sem = semesterId || get().activeSemester;
    const currentAtt = get().attendance;

    const resetRecords = currentAtt.map((a) => {
      if (a.studentId === targetStudentId && Number(a.semester || 2) === Number(sem)) {
        return {
          ...a,
          theoryHeld: 0,
          theoryPresent: 0,
          labHeld: 0,
          labPresent: 0,
          semester: sem,
          lastUpdated: new Date().toISOString().substring(0, 10),
        };
      }
      return a;
    });

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const globalResetEntry: AttendanceLedgerEntry = {
      id: `led_global_reset_${Date.now()}`,
      studentId: targetStudentId,
      subjectCode: 'ALL_SUBJECTS',
      subjectName: 'All Enrolled Subjects',
      date: nowStr,
      sessionType: 'Theory',
      status: 'Reset',
      remarks: `Global reset: Semester ${sem} attendance records reset to 0`,
      semester: sem,
    };

    const updatedLedger = [globalResetEntry, ...get().attendanceLedger];

    for (const rec of resetRecords) {
      if (rec.studentId === targetStudentId && Number(rec.semester || 2) === Number(sem)) {
        await dbServices.saveAttendanceRecord(rec);
      }
    }
    await dbServices.saveAttendanceLedgerEntry(globalResetEntry);
    set({ attendance: resetRecords, attendanceLedger: updatedLedger });
  },

  addAttendanceLedgerEntry: async (entry) => {
    const updated = [entry, ...get().attendanceLedger];
    await dbServices.saveAttendanceLedgerEntry(entry);
    set({ attendanceLedger: updated });
  },

  deleteAttendanceLedgerEntry: async (id) => {
    const updated = get().attendanceLedger.filter((l) => l.id !== id);
    await dbServices.deleteAttendanceLedgerEntry(id);
    set({ attendanceLedger: updated });
  },

  updateMarks: async (record) => {
    const updated = get().marks.map((m) => (m.id === record.id ? record : m));
    await dbServices.saveMarksRecord(record);
    set({ marks: updated });
  },

  addMarksRecord: async (record) => {
    const updated = [record, ...get().marks];
    await dbServices.saveMarksRecord(record);
    set({ marks: updated });
  },

  deleteMarksRecord: async (id) => {
    const updated = get().marks.filter((m) => m.id !== id);
    await dbServices.deleteMarksRecord(id);
    set({ marks: updated });
  },

  addSemesterResult: async (result) => {
    const updated = [...get().semesterResults, result].sort((a, b) => a.semester - b.semester);
    await dbServices.saveSemesterResult(result);
    set({ semesterResults: updated });
  },

  updateSemesterResult: async (result) => {
    const updated = get().semesterResults.map((r) => (r.id === result.id ? result : r)).sort((a, b) => a.semester - b.semester);
    await dbServices.saveSemesterResult(result);
    set({ semesterResults: updated });
  },

  deleteSemesterResult: async (id) => {
    const updated = get().semesterResults.filter((r) => r.id !== id);
    await dbServices.deleteSemesterResult(id);
    set({ semesterResults: updated });
  },

  addAssignment: async (assignment) => {
    const updated = [assignment, ...get().assignments];
    await dbServices.saveAssignment(assignment);
    set({ assignments: updated });
  },

  deleteAssignment: async (id) => {
    const updated = get().assignments.filter((a) => a.id !== id);
    await dbServices.deleteAssignment(id);
    set({ assignments: updated });
  },

  submitAssignment: async (assignmentId, fileName, fileUrl) => {
    const updated = get().assignments.map((asg) => {
      if (asg.id === assignmentId) {
        const item: Assignment = {
          ...asg,
          status: 'Submitted',
          fileName,
          submissionUrl: fileUrl,
          submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
        return item;
      }
      return asg;
    });
    const submitted = updated.find((assignment) => assignment.id === assignmentId);
    if (!submitted) throw new Error('Assignment not found.');
    await dbServices.saveAssignment(submitted);
    set({ assignments: updated });
  },

  addNotice: async (notice) => {
    const updated = [notice, ...get().notices];
    await dbServices.saveNotice(notice);
    set({ notices: updated });
  },

  deleteNotice: async (id) => {
    const updated = get().notices.filter((n) => n.id !== id);
    await dbServices.deleteNotice(id);
    set({ notices: updated });
  },

  addHoliday: async (holiday) => {
    const updated = [...get().holidays, holiday];
    await dbServices.saveHoliday(holiday);
    set({ holidays: updated });
  },

  updateHoliday: async (holiday) => {
    const updated = get().holidays.map((h) => (h.id === holiday.id ? holiday : h));
    await dbServices.saveHoliday(holiday);
    set({ holidays: updated });
  },

  deleteHoliday: async (holidayId) => {
    const updated = get().holidays.filter((h) => h.id !== holidayId);
    await dbServices.deleteHoliday(holidayId);
    set({ holidays: updated });
  },

  clearAllHolidays: async () => {
    await dbServices.clearAllHolidaysInDb();
    set({ holidays: [] });
  },

  addCalendarEvent: async (event) => {
    const updated = [...get().calendarEvents, event];
    await dbServices.saveCalendarEvent(event);
    set({ calendarEvents: updated });
  },

  updateCalendarEvent: async (event) => {
    const updated = get().calendarEvents.map((ev) => (ev.id === event.id ? event : ev));
    await dbServices.saveCalendarEvent(event);
    set({ calendarEvents: updated });
  },

  deleteCalendarEvent: async (eventId) => {
    const updated = get().calendarEvents.filter((ev) => ev.id !== eventId);
    await dbServices.deleteCalendarEvent(eventId);
    set({ calendarEvents: updated });
  },

  clearAllCalendarEvents: async () => {
    const events = get().calendarEvents;
    for (const ev of events) {
      await dbServices.deleteCalendarEvent(ev.id);
    }
    set({ calendarEvents: [] });
  },

  addStudent: async (student) => {
    const updated = [...get().allStudents, student];
    await dbServices.setUserProfile(student);
    set({ allStudents: updated });
  },

  deleteStudent: async (uid) => {
    const updated = get().allStudents.filter((s) => s.uid !== uid && (s as any).id !== uid);
    await dbServices.deleteUserProfile(uid);
    set({ allStudents: updated });
  },

  addSubject: async (subject) => {
    const updated = [...get().subjects, subject];
    await dbServices.saveSubject(subject);
    set({ subjects: updated });
  },

  updateSubject: async (subject) => {
    const updated = get().subjects.map((s) => (s.id === subject.id ? subject : s));
    await dbServices.saveSubject(subject);
    set({ subjects: updated });
  },

  deleteSubject: async (subjectId) => {
    const updated = get().subjects.filter((s) => s.id !== subjectId);
    await dbServices.deleteSubject(subjectId);
    set({ subjects: updated });
  },

  addTimetableSlot: async (slot) => {
    const updated = [...get().timetable, slot];
    await dbServices.saveTimetableSlot(slot);
    set({ timetable: updated });
  },

  updateTimetableSlot: async (slot) => {
    const updated = get().timetable.map((s) => (s.id === slot.id ? slot : s));
    await dbServices.saveTimetableSlot(slot);
    set({ timetable: updated });
  },

  deleteTimetableSlot: async (slotId) => {
    const updated = get().timetable.filter((s) => s.id !== slotId);
    await dbServices.deleteTimetableSlot(slotId);
    set({ timetable: updated });
  },

  massDeleteAcademicData: async () => {
    await dbServices.massDeleteAcademicData();
    set({ subjects: [], timetable: [], calendarEvents: [] });
  },

  resetToDefaultData: async () => {
    await api('/reset', 'POST', {});
    await get().fetchData();
  },
}));
