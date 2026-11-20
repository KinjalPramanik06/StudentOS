import test from 'node:test';
import assert from 'node:assert/strict';
import { profileFieldsForUpdate } from '../backend/profile-fields.mjs';

test('personal details can be updated without a photo field', () => {
  const record = { phone: 'test-phone', rollNumber: 'STUDENT-001', regNumber: 'R1', univRollNumber: 'U1' };
  assert.deepEqual(profileFieldsForUpdate({ role: 'student' }, record), record);
});
test('student edits cannot escalate privileges or change login identity', () => {
  assert.deepEqual(profileFieldsForUpdate({ role: 'student' }, {
    phone: 'test-phone', uid: 'someone-else', role: 'admin', email: 'other@example.com',
    dataAccess: 'Full Read & Write', passwordHash: 'injected', semester: '8',
  }), { phone: 'test-phone' });
});
test('existing photo and admin profile edits are retained', () => {
  const record = { photoURL: '/avatars/profile_fallback.svg', semester: '3' };
  assert.deepEqual(profileFieldsForUpdate({ role: 'student' }, record), { photoURL: record.photoURL });
  assert.deepEqual(profileFieldsForUpdate({ role: 'admin' }, record), record);
});
