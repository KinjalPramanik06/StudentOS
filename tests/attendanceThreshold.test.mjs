import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN_SUBJECT_ATTENDANCE_PERCENT,
  attendanceSemester,
  getAttendancePlan,
  getSubjectAttendance,
} from '../frontend/src/utils/attendanceThreshold.ts';

const record = (present, held, semester = 3) => ({
  theoryPresent: present,
  theoryHeld: held,
  labPresent: 0,
  labHeld: 0,
  semester,
});

test('alerts below 75%, accepts exactly 75%, and waits for the first class', () => {
  assert.equal(MIN_SUBJECT_ATTENDANCE_PERCENT, 75);
  assert.equal(getSubjectAttendance(record(2, 3)).belowMinimum, true);
  assert.equal(getSubjectAttendance(record(3, 4)).belowMinimum, false);
  assert.equal(getSubjectAttendance(record(0, 0)).belowMinimum, false);
  assert.equal(getSubjectAttendance(record(0, 0)).percentage, null);
});

test('uses all classes for one subject and calculates recovery correctly', () => {
  const mixed = { ...record(3, 4), labPresent: 1, labHeld: 2 };
  assert.ok(Math.abs(getSubjectAttendance(mixed).percentage - 400 / 6) < 1e-10);
  assert.deepEqual(getAttendancePlan(6, 4), { canMiss: 0, needToAttend: 2 });
  assert.deepEqual(getAttendancePlan(4, 3), { canMiss: 0, needToAttend: 0 });
  assert.deepEqual(getAttendancePlan(8, 7), { canMiss: 1, needToAttend: 0 });
});

test('keeps older records in semester 2 instead of every semester', () => {
  assert.equal(attendanceSemester(record(3, 4)), 3);
  assert.equal(attendanceSemester({ ...record(3, 4), semester: undefined }), 2);
});
