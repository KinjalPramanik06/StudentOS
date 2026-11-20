import { randomUUID } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { bootstrapAccounts, initializeCleanDatabase, seed } from '../backend/bootstrap.mjs';

// Test-only values; never used as application defaults.
const env = { INITIAL_STUDENT_PASSWORD: randomUUID(), INITIAL_ADMIN_PASSWORD: randomUUID() };
function fakeDatabase(initial = {}) {
  const data = structuredClone(initial);
  return {
    data,
    listCollections: () => ({ toArray: async () => Object.keys(data).map(name => ({ name })) }),
    collection(name) {
      data[name] ??= [];
      return {
        findOne: async query => data[name].find(row => Object.entries(query).every(([key, value]) => row[key] === value)) || null,
        insertMany: async rows => data[name].push(...rows),
        insertOne: async row => data[name].push(row),
      };
    },
  };
}
test('exactly one generic student and one admin, without personal fields or academic records', () => {
  const accounts = bootstrapAccounts(env);
  assert.deepEqual(accounts.map(a => [a.uid, a.role]), [['std_001', 'student'], ['admin_001', 'admin']]);
  for (const account of accounts) for (const key of ['phone', 'rollNumber', 'regNumber', 'bloodGroup']) assert.equal(account[key], '');
  assert.ok(Object.values(seed).every(records => records.length === 0));
});
test('bootstrap requires private passwords and separate identities', () => {
  assert.throws(() => bootstrapAccounts({}), /private/);
  assert.throws(() => bootstrapAccounts({ ...env, INITIAL_ADMIN_PASSWORD: env.INITIAL_STUDENT_PASSWORD }), /different password/);
  assert.throws(() => bootstrapAccounts({ ...env, INITIAL_ADMIN_EMAIL: 'student@example.com' }), /emails must differ/);
  assert.throws(() => bootstrapAccounts({ ...env, INITIAL_ADMIN_EMAIL: 'not-an-email' }), /valid/);
});
test('fresh bootstrap stores hashes only and subsequent startup preserves changed records', async () => {
  const db = fakeDatabase();
  await initializeCleanDatabase(db, env, async () => 'test-hash');
  assert.equal(db.data.students.length, 2);
  assert.ok(db.data.students.every(row => row.passwordHash === 'test-hash' && !('password' in row)));
  db.data.students[0].name = 'Changed';
  await initializeCleanDatabase(db, {}, async () => { throw new Error('must not rehash'); });
  assert.equal(db.data.students.length, 2);
  assert.equal(db.data.students[0].name, 'Changed');
});
test('existing databases are refused without deleting or replacing any data', async () => {
  const db = fakeDatabase({ students: [{ uid: 'existing' }] });
  await assert.rejects(initializeCleanDatabase(db, env, async () => 'hash'), /existing data/);
  assert.deepEqual(db.data.students, [{ uid: 'existing' }]);
});
