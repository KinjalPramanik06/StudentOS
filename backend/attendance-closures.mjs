import { createHash } from 'node:crypto';

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const closureCategories = new Set(['Event', 'Exam', 'Holiday']);

export function closureStatus(collection, record) {
  if (collection === 'holidays') return 'Holiday';
  return record.category === 'Holiday' ? 'Holiday' : closureCategories.has(record.category) ? 'Event' : null;
}

export function closureDates(start, end) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || '') || (end && !/^\d{4}-\d{2}-\d{2}$/.test(end))) throw new Error('Closure dates must use YYYY-MM-DD.');
  if (end && end < start) throw new Error('Closure end date cannot be before its start date.');
  const dates = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const finalDate = end || start;
  while (cursor.toISOString().slice(0, 10) <= finalDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (dates.length > 366) throw new Error('A closure may cover at most 366 days.');
  }
  return dates;
}

export function closureLedgerEntries({ collection, record, studentIds, timetable, academicCalendar = [] }) {
  const status = closureStatus(collection, record);
  if (!status) return [];
  const source = `${collection}:${record.id}`;
  const entries = [];
  for (const date of closureDates(record.date, record.endDate)) {
    const day = weekDays[new Date(`${date}T00:00:00.000Z`).getUTCDay()];
    for (const slot of timetable.filter((item) => item.day === day)) {
      const semesterIsActive = !academicCalendar.length || academicCalendar.some((semester) => (
        Number(semester.semesterNumber) === Number(slot.semester)
        && date >= semester.startDate
        && date <= semester.endDate
      ));
      if (!semesterIsActive) continue;
      for (const studentId of studentIds) {
        const digest = createHash('sha256').update(`${source}:${studentId}:${slot.id}:${date}`).digest('hex').slice(0, 24);
        entries.push({
          id: `closure_${digest}`,
          studentId,
          subjectCode: slot.subjectCode,
          subjectName: slot.subjectName,
          date: `${date} 00:00`,
          sessionType: slot.type === 'Lab' ? 'Lab' : 'Theory',
          status,
          remarks: `${status === 'Holiday' ? 'Holiday' : 'Event / exam'}: ${record.title}`,
          semester: Number(slot.semester || 2),
          automaticClosure: true,
          closureSource: source,
        });
      }
    }
  }
  return entries;
}

export function dateKey(value) {
  return String(value || '').slice(0, 10);
}
