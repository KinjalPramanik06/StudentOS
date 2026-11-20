import test from 'node:test';
import assert from 'node:assert/strict';
import { localDateKey, calendarActivity } from '../frontend/src/utils/calendarActivity.ts';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Load the actual TypeScript engine; only its fallback fixture import is substituted.
const engineSource = await readFile(new URL('../frontend/src/utils/academicCalendarEngine.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(engineSource, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  .replace(/import \{ DEFAULT_ACADEMIC_CALENDAR \} from '[^']+';/, 'const DEFAULT_ACADEMIC_CALENDAR = [];');
const { getSemesterInfo, calculateSemesterProgress } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const semester = { id: 3, semesterNumber: 3, name: 'Semester 3', fullName: 'Semester 3', session: '2026-2027', department: 'CSE', startDate: '2026-08-17', endDate: '2027-01-31', isEnabled: true };
const events = [{ id: 'exam', title: 'CIA 1', date: '2026-09-28', endDate: '2026-09-29', category: 'Exam' }];
const info = { status: 'Semester Active' };

test('empty calendar has no dates or fabricated completed degree', () => {
  const empty = getSemesterInfo(new Date(), []);
  assert.equal(empty.currentSemesterId, null);
  assert.equal(empty.progressPercentage, 0);
  assert.equal(empty.startDate, '');
  assert.equal(empty.endDate, '');
  assert.equal(empty.totalDays, 0);
  assert.notEqual(empty.status, 'Semester Completed');
});

test('never guesses an exam from the semester percentage', () => {
  assert.equal(calendarActivity(info, '2026-09-27', events, []), 'No calendar events today');
  assert.equal(calendarActivity(info, '2026-09-28', events, []), 'CIA 1');
  assert.equal(calendarActivity(info, '2026-09-29', events, []), 'CIA 1');
  assert.equal(calendarActivity(info, '2026-09-30', events, []), 'No calendar events today');
});
test('shows holidays and multiple actual events, respects inactive semester states', () => {
  const holidays = [{ title: 'College holiday', date: '2026-09-28' }];
  assert.equal(calendarActivity(info, '2026-09-28', events, holidays), 'College holiday · CIA 1');
  for (const status of ['Semester Upcoming', 'Semester Break', 'Semester Completed']) {
    assert.equal(calendarActivity({ status }, '2026-09-28', events, holidays), status);
  }
});
test('semester dates and local today stay consistent in positive and negative time zones', () => {
  const previous = process.env.TZ;
  try {
    for (const timezone of ['Asia/Kolkata', 'America/Los_Angeles']) {
      process.env.TZ = timezone;
      const day = new Date(2026, 8, 27, 23, 59);
      assert.equal(localDateKey(day), '2026-09-27');
      const result = getSemesterInfo(day, [semester]);
      assert.equal(result.status, 'Semester Active');
      assert.equal(result.daysCompleted, 42);
      assert.equal(result.totalDays, 168);
      assert.equal(result.progressPercentage, 25);
      assert.equal(getSemesterInfo(new Date(2026, 7, 17), [semester]).status, 'Semester Active');
      assert.equal(getSemesterInfo(new Date(2027, 0, 31), [semester]).status, 'Semester Active');
      assert.equal(getSemesterInfo(new Date(2027, 1, 1), [semester]).status, 'Semester Completed');
      assert.equal(calculateSemesterProgress(semester.startDate, semester.endDate, new Date(2026, 7, 16)).progressPercentage, 0);
    }
  } finally {
    if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
  }
});
