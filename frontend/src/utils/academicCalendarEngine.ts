import type { AcademicSemester, SemesterInfo } from '../types';
import { DEFAULT_ACADEMIC_CALENDAR } from '../data/defaultAcademicCalendar';

function parseDateAtMidnight(dateStrOrObj: string | Date): Date {
  // YYYY-MM-DD is a local calendar date, not a UTC timestamp.
  const d = typeof dateStrOrObj === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStrOrObj)
    ? new Date(Number(dateStrOrObj.slice(0, 4)), Number(dateStrOrObj.slice(5, 7)) - 1, Number(dateStrOrObj.slice(8, 10)))
    : new Date(dateStrOrObj);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function calculateSemesterProgress(
  startDateStr: string,
  endDateStr: string,
  targetDate: Date = new Date()
) {
  const start = parseDateAtMidnight(startDateStr);
  const end = parseDateAtMidnight(endDateStr);
  const current = parseDateAtMidnight(targetDate);

  const oneDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / oneDay) + 1);

  if (current.getTime() < start.getTime()) {
    return {
      daysCompleted: 0,
      daysRemaining: totalDays,
      totalDays,
      progressPercentage: 0,
    };
  }

  if (current.getTime() > end.getTime()) {
    return {
      daysCompleted: totalDays,
      daysRemaining: 0,
      totalDays,
      progressPercentage: 100,
    };
  }

  const daysCompleted = Math.min(totalDays, Math.max(1, Math.round((current.getTime() - start.getTime()) / oneDay) + 1));
  const daysRemaining = Math.max(0, totalDays - daysCompleted);
  const progressPercentage = Math.min(100, Math.max(0, Math.round((daysCompleted / totalDays) * 100)));

  return {
    daysCompleted,
    daysRemaining,
    totalDays,
    progressPercentage,
  };
}

export function getSemesterInfo(
  targetDate: Date = new Date(),
  customCalendar?: AcademicSemester[]
): SemesterInfo {
  const calendar = (customCalendar && customCalendar.length > 0
    ? customCalendar
    : DEFAULT_ACADEMIC_CALENDAR
  ).filter((s) => s.isEnabled !== false);

  calendar.sort((a, b) => parseDateAtMidnight(a.startDate).getTime() - parseDateAtMidnight(b.startDate).getTime());

  if (!calendar.length) return {
    status: 'Semester Upcoming', currentSemesterId: null,
    semesterName: 'No semester configured', fullName: 'Add semester dates to get started',
    academicSession: '', department: '', startDate: '', endDate: '',
    daysCompleted: 0, daysRemaining: 0, totalDays: 0, progressPercentage: 0,
  };
  const now = parseDateAtMidnight(targetDate);

  // 1. Check for Active Semester match
  for (let i = 0; i < calendar.length; i++) {
    const sem = calendar[i];
    const start = parseDateAtMidnight(sem.startDate);
    const end = parseDateAtMidnight(sem.endDate);

    if (sem.isBreak) continue;

    if (now.getTime() >= start.getTime() && now.getTime() <= end.getTime()) {
      const { daysCompleted, daysRemaining, totalDays, progressPercentage } = calculateSemesterProgress(
        sem.startDate,
        sem.endDate,
        now
      );

      return {
        status: 'Semester Active',
        currentSemesterId: sem.id,
        semesterName: sem.name,
        fullName: sem.fullName,
        academicSession: sem.session,
        department: sem.department,
        startDate: sem.startDate,
        endDate: sem.endDate,
        daysCompleted,
        daysRemaining,
        totalDays,
        progressPercentage,
      };
    }
  }

  // 2. Check if today falls in a gap between two active semesters (Semester Break)
  for (let i = 0; i < calendar.length; i++) {
    const prevSem = calendar[i];
    const nextSem = calendar[i + 1];

    // Explicitly marked break semester
    if (prevSem.isBreak) {
      const start = parseDateAtMidnight(prevSem.startDate);
      const end = parseDateAtMidnight(prevSem.endDate);
      if (now.getTime() >= start.getTime() && now.getTime() <= end.getTime()) {
        const { daysCompleted, daysRemaining, totalDays, progressPercentage } = calculateSemesterProgress(
          prevSem.startDate,
          prevSem.endDate,
          now
        );
        return {
          status: 'Semester Break',
          currentSemesterId: prevSem.id,
          semesterName: 'Semester Break',
          fullName: 'Academic Semester Break',
          academicSession: prevSem.session,
          department: prevSem.department,
          startDate: prevSem.startDate,
          endDate: prevSem.endDate,
          daysCompleted,
          daysRemaining,
          totalDays,
          progressPercentage,
          nextSemesterStartsInDays: daysRemaining,
          nextSemesterName: nextSem ? nextSem.name : undefined,
        };
      }
    }

    // Gap between current semester end and next semester start
    if (nextSem) {
      const prevEnd = parseDateAtMidnight(prevSem.endDate);
      const nextStart = parseDateAtMidnight(nextSem.startDate);

      if (now.getTime() > prevEnd.getTime() && now.getTime() < nextStart.getTime()) {
        const breakStartStr = prevSem.endDate;
        const breakEndStr = nextSem.startDate;
        const { daysCompleted, daysRemaining, totalDays, progressPercentage } = calculateSemesterProgress(
          breakStartStr,
          breakEndStr,
          now
        );

        return {
          status: 'Semester Break',
          currentSemesterId: nextSem.id,
          semesterName: 'Semester Break',
          fullName: `Semester Break (${prevSem.name} → ${nextSem.name})`,
          academicSession: `${prevSem.session} / ${nextSem.session}`,
          department: prevSem.department,
          startDate: breakStartStr,
          endDate: breakEndStr,
          daysCompleted,
          daysRemaining,
          totalDays,
          progressPercentage,
          nextSemesterStartsInDays: Math.max(0, Math.ceil((nextStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
          nextSemesterName: nextSem.name,
        };
      }
    }
  }

  // 3. Before first semester
  if (calendar.length > 0 && now.getTime() < parseDateAtMidnight(calendar[0].startDate).getTime()) {
    const firstSem = calendar[0];
    const firstStart = parseDateAtMidnight(firstSem.startDate);
    const daysUntil = Math.ceil((firstStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      status: 'Semester Upcoming',
      currentSemesterId: firstSem.id,
      semesterName: 'Semester Upcoming',
      fullName: `Upcoming: ${firstSem.fullName}`,
      academicSession: firstSem.session,
      department: firstSem.department,
      startDate: firstSem.startDate,
      endDate: firstSem.endDate,
      daysCompleted: 0,
      daysRemaining: daysUntil,
      totalDays: daysUntil,
      progressPercentage: 0,
      nextSemesterStartsInDays: daysUntil,
      nextSemesterName: firstSem.name,
    };
  }

  // 4. After last semester
  const lastSem = calendar[calendar.length - 1];
  return {
    status: 'Semester Completed',
    currentSemesterId: lastSem ? lastSem.id : 8,
    semesterName: 'Semester Completed',
    fullName: 'Academic Program Completed',
    academicSession: lastSem ? lastSem.session : '2028-2029',
    department: lastSem ? lastSem.department : 'Computer Science & Engineering',
    startDate: lastSem ? lastSem.startDate : '2025-09-15',
    endDate: lastSem ? lastSem.endDate : '2029-07-31',
    daysCompleted: 100,
    daysRemaining: 0,
    totalDays: 100,
    progressPercentage: 100,
  };
}
