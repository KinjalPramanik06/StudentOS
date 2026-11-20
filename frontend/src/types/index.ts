export type UserRole = 'student' | 'admin';

export interface AcademicSemester {
  id: number;
  semesterNumber: number;
  name: string;
  fullName: string;
  session: string;
  department: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  isEnabled: boolean;
  isBreak?: boolean;
  description?: string;
}

export type SemesterStatus = 'Semester Active' | 'Semester Break' | 'Semester Completed' | 'Semester Upcoming';

export interface SemesterInfo {
  status: SemesterStatus;
  currentSemesterId: number | null;
  semesterName: string;
  fullName: string;
  academicSession: string;
  department: string;
  startDate: string;
  endDate: string;
  daysCompleted: number;
  daysRemaining: number;
  totalDays: number;
  progressPercentage: number;
  nextSemesterStartsInDays?: number;
  nextSemesterName?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  rollNumber: string;
  regNumber: string;
  univRollNumber?: string;
  department: string;
  semester: string;
  section: string;
  phone: string;
  bloodGroup: string;
  photoURL?: string;
  academicYear?: string;
  dataAccess?: 'Full Read & Write' | 'Read Only' | 'Restricted';
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  faculty: string;
  facultyEmail?: string;
  credits: number;
  type: 'Theory' | 'Lab' | 'Audit';
  room: string;
  description: string;
  syllabus?: string[];
  books?: string[];
  scheduleDetails?: string;
  semester?: number;
}

export interface TimetableSlot {
  id: string;
  studentId?: string;
  semester?: number; // 1 to 8
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  timeSlot: string; // e.g. "10:00-10:50"
  subjectCode: string;
  subjectName: string;
  faculty: string;
  room: string;
  type: 'Theory' | 'Lab' | 'Break';
  credits: number;
  group?: string; // e.g. "GR 1", "GR 2"
  isHoliday?: boolean;
  notes?: string; // Writing, special class notes, or venue instructions from admin
  customTimeLabel?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectCode: string;
  subjectName: string;
  theoryHeld: number;
  theoryPresent: number;
  labHeld: number;
  labPresent: number;
  semester?: number;
  lastUpdated?: string;
}

export interface AttendanceLedgerEntry {
  id: string;
  studentId: string;
  subjectCode: string;
  subjectName: string;
  date: string;
  sessionType: 'Theory' | 'Lab';
  status: 'Present' | 'Absent' | 'Off' | 'Event' | 'Holiday' | 'Reset';
  remarks?: string;
  semester?: number;
  automaticClosure?: boolean;
  closureSource?: string;
}

export interface MarksRecord {
  id: string;
  studentId: string;
  subjectCode: string;
  subjectName: string;
  cia1: number; // Max 25 or 30
  cia2: number;
  cia3: number;
  pcia1: number; // Practical CIA
  pcia2: number;
  semExam: number; // Max 70 or 100
  totalMax: number;
  grade?: string;
  remarks?: string;
  semester?: number;
}

export interface SemesterResult {
  id: string;
  studentId: string;
  semester: number;
  sgpa: number;
  ygpa: number;
  creditsEarned: number;
  totalCredits: number;
  backlogs: number;
  rank: number;
  academicYear: string;
  status?: string;
}

export interface Holiday {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  category: 'National' | 'College' | 'Festival' | 'Exam Break' | 'Vacation';
  description: string;
  isImportant?: boolean;
}

export interface CalendarEvent {
  id: string;
  studentId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  category: 'Academic' | 'Exam' | 'Registration' | 'Holiday' | 'Event';
  description: string;
  location?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  description: string;
  dueDate: string; // YYYY-MM-DD HH:mm
  totalMarks: number;
  status: 'Pending' | 'Submitted' | 'Graded';
  submissionUrl?: string;
  fileName?: string;
  submittedAt?: string;
  score?: number;
  feedback?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  category: 'General' | 'Exam' | 'Academic' | 'Event';
  priority: 'High' | 'Normal';
  targetAudience?: string;
}
