export const coreIds = new Set(['std_001', 'admin_001']);
export const seed = Object.fromEntries([
  'students', 'subjects', 'timetable', 'attendance', 'attendanceLedger', 'marks',
  'semesterResults', 'holidays', 'calendarEvents', 'assignments', 'notices',
  'academicCalendar', 'settings',
].map(name => [name, []]));

export function bootstrapAccounts(env) {
  const blank = {
    rollNumber: '', regNumber: '', univRollNumber: '', department: '',
    semester: '', section: '', phone: '', bloodGroup: '', academicYear: '',
    photoURL: '/avatars/profile_fallback.svg', dataAccess: 'Full Read & Write',
  };
  const accounts = [
    { ...blank, uid: 'std_001', name: 'Student', role: 'student',
      email: (env.INITIAL_STUDENT_EMAIL || 'student@example.com').trim().toLowerCase(),
      password: env.INITIAL_STUDENT_PASSWORD },
    { ...blank, uid: 'admin_001', name: 'Admin', role: 'admin',
      email: (env.INITIAL_ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase(),
      password: env.INITIAL_ADMIN_PASSWORD },
  ];
  for (const account of accounts) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)) {
      throw new Error('Set valid INITIAL_STUDENT_EMAIL and INITIAL_ADMIN_EMAIL values.');
    }
    if (typeof account.password !== 'string' || account.password.length < 12 ||
        account.password.length > 128 || /^(change|replace|your[-_ ]|example)/i.test(account.password)) {
      throw new Error('Set private INITIAL_STUDENT_PASSWORD and INITIAL_ADMIN_PASSWORD values (12–128 characters).');
    }
  }
  if (accounts[0].email === accounts[1].email) throw new Error('Student and admin emails must differ.');
  if (accounts[0].password === accounts[1].password) throw new Error('Use a different password for each account.');
  return accounts;
}

export async function initializeCleanDatabase(db, env, hashPassword) {
  const system = db.collection('system');
  if (await system.findOne({ key: 'cleanBootstrapV1' })) return;
  // Never erase or silently reuse the original database. A fresh database is required.
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  for (const { name } of collections) {
    if (name.startsWith('system.')) continue;
    if (await db.collection(name).findOne({})) {
      throw new Error('This database contains existing data. Set MONGODB_DB to a new, empty database name. No records were deleted.');
    }
  }
  const profiles = await Promise.all(bootstrapAccounts(env).map(async ({ password, ...profile }) => ({
    ...profile, passwordHash: await hashPassword(password), passwordChangedAt: new Date(),
  })));
  await db.collection('students').insertMany(profiles);
  await system.insertOne({ key: 'cleanBootstrapV1', date: new Date() });
}
