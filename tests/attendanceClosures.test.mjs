import assert from 'node:assert/strict';
import test from 'node:test';
import { closureDates, closureLedgerEntries, closureStatus, dateKey } from '../backend/attendance-closures.mjs';

const timetable = [
  { id: 'slot_mon_theory', day: 'Monday', subjectCode: 'CSE-301', subjectName: 'Data Structures', type: 'Theory', semester: 3 },
  { id: 'slot_mon_lab', day: 'Monday', subjectCode: 'CSE-391', subjectName: 'Data Structures Lab', type: 'Lab', semester: 3 },
  { id: 'slot_tue', day: 'Tuesday', subjectCode: 'CSE-302', subjectName: 'Math', type: 'Theory', semester: 3 },
];

test('an event creates one non-counting ledger record per scheduled class and student', () => {
  const entries = closureLedgerEntries({
    collection: 'calendarEvents',
    record: { id: 'event_1', title: 'Institute fest', date: '2026-10-05', category: 'Event' },
    studentIds: ['std_001', 'std_002'],
    timetable,
  });

  assert.equal(entries.length, 4);
  assert.ok(entries.every((entry) => entry.status === 'Event'));
  assert.ok(entries.every((entry) => entry.automaticClosure));
  assert.ok(entries.every((entry) => entry.closureSource === 'calendarEvents:event_1'));
  assert.deepEqual(new Set(entries.map((entry) => entry.sessionType)), new Set(['Theory', 'Lab']));
  assert.ok(entries.every((entry) => !('held' in entry) && !('present' in entry)));
});

test('holiday and exam closures map to the correct attendance statuses', () => {
  assert.equal(closureStatus('holidays', { category: 'National' }), 'Holiday');
  assert.equal(closureStatus('calendarEvents', { category: 'Exam' }), 'Event');
  assert.equal(closureStatus('calendarEvents', { category: 'Academic' }), null);

  const entries = closureLedgerEntries({
    collection: 'holidays',
    record: { id: 'holiday_1', title: 'National holiday', date: '2026-10-05', endDate: '2026-10-06' },
    studentIds: ['std_001'],
    timetable,
  });
  assert.equal(entries.length, 3);
  assert.ok(entries.every((entry) => entry.status === 'Holiday'));
});

test('closure dates include both ends and reject invalid ranges', () => {
  assert.deepEqual(closureDates('2026-10-05', '2026-10-07'), ['2026-10-05', '2026-10-06', '2026-10-07']);
  assert.throws(() => closureDates('2026-10-07', '2026-10-05'), /before/);
  assert.throws(() => closureDates('05-10-2026'), /YYYY-MM-DD/);
  assert.equal(dateKey('2026-10-05 10:00'), '2026-10-05');
});

test('a closure only creates attendance entries during the slot semester', () => {
  const entries = closureLedgerEntries({
    collection: 'calendarEvents',
    record: { id: 'event_outside_semester', title: 'Institute fest', date: '2026-10-05', category: 'Event' },
    studentIds: ['std_001'],
    timetable,
    academicCalendar: [{ semesterNumber: 3, startDate: '2026-08-17', endDate: '2027-01-31' }],
  });
  assert.equal(entries.length, 2);

  const outsideEntries = closureLedgerEntries({
    collection: 'calendarEvents',
    record: { id: 'event_before_semester', title: 'Institute fest', date: '2026-03-02', category: 'Event' },
    studentIds: ['std_001'],
    timetable,
    academicCalendar: [{ semesterNumber: 3, startDate: '2026-08-17', endDate: '2027-01-31' }],
  });
  assert.equal(outsideEntries.length, 0);
});
