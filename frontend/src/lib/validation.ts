import { z } from 'zod';

/**
 * XSS & HTML Sanitizer Function
 * Strips HTML tags, script tags, javascript: URIs, and trims string inputs.
 */
export function sanitizeString(input?: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script blocks
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Prevent inline JS protocol
    .replace(/onload=/gi, '')
    .replace(/onerror=/gi, '')
    .trim();
}

// Identity and authorization are checked by the server, never by a public allowlist.
export function isAllowedCollegeDomainOrEmail(email: string): boolean {
  return z.string().email().safeParse(email.trim()).success;
}

/**
 * User Profile Zod Validation Schema
 */
export const userProfileSchema = z.object({
  uid: z.string().min(1, 'UID is required'),
  email: z.string().email('Invalid email address format').transform(sanitizeString),
  name: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name too long').transform(sanitizeString),
  role: z.enum(['student', 'admin']),
  rollNumber: z.string().max(40).transform(sanitizeString).optional().default(''),
  regNumber: z.string().max(40).transform(sanitizeString).optional().default(''),
  univRollNumber: z.string().max(40).transform(sanitizeString).optional().default(''),
  department: z.string().max(100).transform(sanitizeString).optional().default(''),
  semester: z.string().max(40).transform(sanitizeString).optional().default(''),
  section: z.string().max(20).transform(sanitizeString).optional().default(''),
  phone: z.string().max(20).transform(sanitizeString).optional().default(''),
  bloodGroup: z.string().max(10).transform(sanitizeString).optional().default(''),
  photoURL: z.string().url('Invalid photo URL').or(z.string().max(500)).optional(),
  academicYear: z.string().max(30).transform(sanitizeString).optional(),
  dataAccess: z.enum(['Full Read & Write', 'Read Only', 'Restricted']).optional().default('Full Read & Write'),
});

/**
 * Auth Login Zod Validation Schema
 */
export const authLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address').transform(sanitizeString),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'admin']).optional(),
});

/**
 * Auth Registration Zod Validation Schema
 */
export const authRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name too long').transform(sanitizeString),
  email: z.string().email('Please enter a valid institute email').transform(sanitizeString),
  role: z.enum(['student', 'admin']),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Marks Entry Zod Schema
 */
export const marksRecordSchema = z.object({
  id: z.string().min(1),
  studentId: z.string().min(1),
  subjectCode: z.string().min(1).transform(sanitizeString),
  subjectName: z.string().optional().default('Subject').transform(sanitizeString),
  cia1: z.number().min(0).max(100),
  cia2: z.number().min(0).max(100),
  cia3: z.number().min(0).max(100),
  pcia1: z.number().min(0).max(100).optional().default(0),
  pcia2: z.number().min(0).max(100).optional().default(0),
  semExam: z.number().min(0).max(100),
  totalMax: z.number().optional().default(100),
  grade: z.string().optional().transform(sanitizeString),
  remarks: z.string().optional().transform(sanitizeString),
  semester: z.number().min(1).max(12).optional(),
});

/**
 * Semester Result Zod Schema
 */
export const semesterResultSchema = z.object({
  id: z.string().min(1),
  studentId: z.string().min(1),
  semester: z.number().min(1).max(12),
  sgpa: z.number().min(0).max(10),
  ygpa: z.number().min(0).max(10),
  creditsEarned: z.number().min(0).max(300),
  totalCredits: z.number().min(0).max(300),
  backlogs: z.number().min(0).optional().default(0),
  rank: z.number().min(0).optional().default(1),
  academicYear: z.string().optional().default('').transform(sanitizeString),
  percentage: z.number().min(0).max(100).optional(),
  status: z.string().optional().transform(sanitizeString),
});

/**
 * Attendance Record Zod Schema
 */
export const attendanceRecordSchema = z.object({
  id: z.string().min(1),
  studentId: z.string().min(1),
  subjectCode: z.string().min(1).transform(sanitizeString),
  subjectName: z.string().optional().default('Subject').transform(sanitizeString),
  theoryHeld: z.number().min(0, 'Held classes cannot be negative'),
  theoryPresent: z.number().min(0, 'Present classes cannot be negative'),
  labHeld: z.number().min(0).optional().default(0),
  labPresent: z.number().min(0).optional().default(0),
  semester: z.number().min(1).max(12).optional(),
});

/**
 * Notice Zod Schema
 */
export const noticeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3, 'Title too short').max(150, 'Title too long').transform(sanitizeString),
  content: z.string().min(5, 'Notice content too short').max(2000, 'Content too long').transform(sanitizeString),
  date: z.string().transform(sanitizeString),
  author: z.string().transform(sanitizeString),
  category: z.enum(['General', 'Exam', 'Academic', 'Event']).optional().default('General'),
  priority: z.enum(['High', 'Normal', 'high', 'medium', 'low']).transform((val) => (val === 'High' || val === 'high' ? 'High' : 'Normal')),
});

/**
 * Assignment Zod Schema
 */
export const assignmentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3, 'Title too short').max(150).transform(sanitizeString),
  subjectCode: z.string().min(1).transform(sanitizeString),
  subjectName: z.string().optional().default('Subject').transform(sanitizeString),
  description: z.string().max(1000).transform(sanitizeString),
  dueDate: z.string().transform(sanitizeString),
  totalMarks: z.number().min(1).max(100),
  status: z.enum(['Pending', 'Submitted', 'Graded', 'pending', 'submitted', 'graded']).transform((val) => {
    const lower = val.toLowerCase();
    if (lower === 'submitted') return 'Submitted';
    if (lower === 'graded') return 'Graded';
    return 'Pending';
  }),
});
