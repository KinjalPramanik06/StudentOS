import http from 'node:http';
import net from 'node:net';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';
import { spawn } from 'node:child_process';
import { execFile } from 'node:child_process';
import dns from 'node:dns';
import { profileFieldsForUpdate } from './profile-fields.mjs';
import { personalCollections, mergePersonalRecords } from './personal-records.mjs';
import { originIsAllowed } from './request-origin.mjs';
import { closureLedgerEntries, dateKey } from './attendance-closures.mjs';
import { seed, coreIds, initializeCleanDatabase } from './bootstrap.mjs';

const scrypt = promisify(scryptCallback);
const execFileAsync = promisify(execFile);
if (process.env.MONGODB_DNS_SERVER) dns.setServers([process.env.MONGODB_DNS_SERVER]);
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required. See .env.example.');
const port = Number(process.env.PORT || 5501);
const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

await new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.once('error', reject);
  probe.listen(port, host, () => probe.close(resolve));
}).catch((error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop your IDE's Live Server or other app on that port, then retry.`);
  } else {
    console.error(`Cannot use port ${port}: ${error.message}`);
  }
  process.exit(1);
});

async function windowsSrvFallback(originalUri) {
  const parsed = new URL(originalUri);
  const hostname = parsed.hostname;
  if (!/^[a-z\d.-]+$/i.test(hostname)) throw new Error('Invalid MongoDB hostname.');
  // Windows' system resolver can work even when Node's DNS server (often 127.0.0.1)
  // cannot answer SRV queries. Query records, never credentials, in PowerShell.
  const script = [
    "$ErrorActionPreference = 'Stop'",
    `$srv = @(Resolve-DnsName -Name '_mongodb._tcp.${hostname}' -Type SRV | Where-Object { $_.Type -eq 'SRV' -and $_.NameTarget } | ForEach-Object { @{ host = $_.NameTarget.TrimEnd('.'); port = $_.Port } })`,
    `$txt = @(Resolve-DnsName -Name '${hostname}' -Type TXT | Where-Object { $_.Type -eq 'TXT' -and $_.Strings } | ForEach-Object { $_.Strings -join '' })`,
    '@{ srv = $srv; txt = $txt } | ConvertTo-Json -Compress -Depth 5',
  ].join('; ');
  const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    windowsHide: true,
    timeout: 15000,
    maxBuffer: 64 * 1024,
  });
  const records = JSON.parse(stdout);
  const hosts = records.srv.map(({ host, port }) => `${host}:${port}`);
  if (!hosts.length) throw new Error('MongoDB SRV lookup returned no servers.');
  const params = new URLSearchParams(parsed.search);
  for (const txt of records.txt || []) {
    for (const [key, value] of new URLSearchParams(txt)) {
      if (!params.has(key)) params.set(key, value);
    }
  }
  if (!params.has('tls')) params.set('tls', 'true');
  params.delete('srvMaxHosts');
  const auth = parsed.password ? `${parsed.username}:${parsed.password}@` : `${parsed.username}@`;
  return `mongodb://${auth}${hosts.join(',')}${parsed.pathname}?${params}`;
}

async function connectMongo() {
  const options = { maxPoolSize: 5, serverSelectionTimeoutMS: 10000 };
  const canUseWindowsDns = process.platform === 'win32' && uri.startsWith('mongodb+srv://');
  const nodeUsesLoopbackDns = canUseWindowsDns && dns.getServers().every((server) =>
    server === '::1' || server.startsWith('127.'));
  let connectionUri = uri;
  if (nodeUsesLoopbackDns) {
    try {
      connectionUri = await windowsSrvFallback(uri);
      console.info('Using Windows DNS for MongoDB Atlas.');
    } catch {
      console.warn('Windows DNS lookup failed; trying Node DNS.');
    }
  }
  let mongo = new MongoClient(connectionUri, options);
  try {
    await mongo.connect();
    return mongo;
  } catch (error) {
    await mongo.close();
    if (!canUseWindowsDns || connectionUri !== uri ||
        !['ETIMEOUT', 'ENOTFOUND', 'ESERVFAIL', 'ECONNREFUSED'].includes(error.code)) throw error;
    console.warn('Node DNS could not resolve the MongoDB SRV record; trying Windows DNS.');
    mongo = new MongoClient(await windowsSrvFallback(uri), options);
    await mongo.connect();
    return mongo;
  }
}

let client;
try {
  client = await connectMongo();
} catch (error) {
  const cause = error.cause?.code || error.reason?.servers?.values().next().value?.error?.cause?.code;
  if (cause === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR') {
    console.error('MongoDB Atlas rejected the TLS handshake before password authentication. Verify that this computer\'s current public IP is Active in Network Access for the same Atlas project as the cluster. If it is, try another network and retry.');
  } else if (error.code === 18 || error.codeName === 'AuthenticationFailed') {
    console.error('MongoDB authentication failed. Check the database-user password in .env.');
  } else {
    console.error('MongoDB startup failed. Check the private connection settings and database access.');
  }
  process.exit(1);
}
const db = client.db(process.env.MONGODB_DB || 'studentos_clean');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const keys = {
  students: 'uid', subjects: 'id', timetable: 'id', attendance: 'id',
  attendanceLedger: 'id', marks: 'id', semesterResults: 'id',
  holidays: 'id', calendarEvents: 'id', assignments: 'id',
  notices: 'id', academicCalendar: 'id', settings: 'key',
};
const privateCollections = new Set(['attendance', 'attendanceLedger', 'marks', 'semesterResults']);
const studentWriteCollections = new Set([...privateCollections, ...personalCollections]);
const cookieName = 'studentos_session';
const sessionDays = 7;

function json(res, status, value, extra = {}) {
  const body = JSON.stringify(value);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra });
  res.end(body);
}
function fail(status, message) { const error = new Error(message); error.status = status; throw error; }
function publicProfile(doc) {
  if (!doc) return null;
  const { _id, passwordHash, legacyHashes, ...profile } = doc;
  return profile;
}
function safeDocument(doc) {
  if (!doc) return null;
  const { _id, _sharedRevision, ...record } = doc;
  return record;
}
async function bodyOf(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) fail(415, 'JSON content type required.');
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 1024 * 1024) fail(413, 'Request exceeds 1 MB.');
  }
  try { return JSON.parse(text); } catch { fail(400, 'Invalid JSON.'); }
}
function validateRecord(value, keyName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'A record object is required.');
  const id = value[keyName];
  if ((typeof id !== 'string' || !id || id.length > 150) && !(keyName === 'id' && typeof id === 'number' && Number.isSafeInteger(id))) fail(400, 'Invalid record key.');
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.') || ['_id', '_sharedRevision', 'passwordHash', 'legacyHashes', 'role'].includes(key)) {
      if (!(key === 'role' && keyName === 'uid')) fail(400, 'Record contains a protected field.');
    }
  }
  return value;
}
function hashToken(token) { return createHash('sha256').update(token).digest('hex'); }
async function passwordHash(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt.toString('hex')}:${derived.toString('hex')}`;
}
async function matchesPassword(user, password) {
  if (user.passwordHash?.startsWith('scrypt:')) {
    const [, salt, expected] = user.passwordHash.split(':');
    const actual = await scrypt(password, Buffer.from(salt, 'hex'), 64);
    return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
  }
  return false;
}
function sessionCookie(token, ageSeconds) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${cookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${ageSeconds}${secure}`;
}
async function currentUser(req) {
  const token = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.collection('sessions').findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  return db.collection('students').findOne({ uid: session.uid });
}
function requireAdmin(user) { if (user.role !== 'admin') fail(403, 'Administrator access required.'); }
function checkOrigin(req) {
  if (!originIsAllowed(req)) fail(403, 'Origin is not allowed.');
}
async function studentIdsForClosure(user) {
  if (user.role !== 'admin') return [user.uid];
  return (await db.collection('students').find({ role: 'student' }, { projection: { uid: 1 } }).toArray()).map((student) => student.uid);
}
async function clearAttendanceClosure(collectionName, recordId, studentIds) {
  if (!['calendarEvents', 'holidays'].includes(collectionName)) return;
  await db.collection('attendanceLedger').deleteMany({
    automaticClosure: true,
    closureSource: `${collectionName}:${recordId}`,
    studentId: { $in: studentIds },
  });
}
async function syncAttendanceClosure(collectionName, record, studentIds) {
  if (!['calendarEvents', 'holidays'].includes(collectionName)) return;
  await clearAttendanceClosure(collectionName, record.id, studentIds);
  const [timetable, academicCalendar] = await Promise.all([
    db.collection('timetable').find({}).toArray(),
    db.collection('academicCalendar').find({}).toArray(),
  ]);
  const entries = closureLedgerEntries({ collection: collectionName, record, studentIds, timetable, academicCalendar });
  if (!entries.length) return;
  await db.collection('attendanceLedger').bulkWrite(entries.map((entry) => ({
    updateOne: { filter: { id: entry.id }, update: { $set: entry }, upsert: true },
  })));
}
async function rejectAttendanceOnClosedClass(record) {
  if (!['Present', 'Absent'].includes(record.status)) return;
  const date = dateKey(record.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(400, 'Attendance date must use YYYY-MM-DD.');
  const closure = await db.collection('attendanceLedger').findOne({
    studentId: record.studentId,
    subjectCode: record.subjectCode,
    sessionType: record.sessionType,
    automaticClosure: true,
    date: { $regex: `^${date}` },
  });
  if (closure) fail(409, `This class is marked ${closure.status}; attendance cannot be calculated for that day.`);
}
async function initialize() {
  for (const [name, key] of Object.entries(keys)) {
    await db.collection(name).createIndex({ [key]: 1 }, { unique: true });
  }
  await db.collection('students').createIndex({ email: 1 }, { unique: true });
  await db.collection('studentAssignments').createIndex({ id: 1, studentId: 1 }, { unique: true });
  await db.collection('attendanceLedger').createIndex({ closureSource: 1, studentId: 1 });
  await db.collection('personalRecords').createIndex({ collection: 1, studentId: 1, recordKey: 1 }, { unique: true });
  await db.collection('sessions').createIndex({ tokenHash: 1 }, { unique: true });
  await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('loginFailures').createIndex({ key: 1 }, { unique: true });
  await db.collection('loginFailures').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await initializeCleanDatabase(db, process.env, passwordHash);
}
await initialize();

async function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const file = path.resolve(root, 'dist', '.' + requested);
  const dist = path.resolve(root, 'dist');
  if (!file.startsWith(dist + path.sep)) fail(404, 'Not found.');
  let target = file;
  try { if (!(await stat(target)).isFile()) throw new Error('missing'); }
  catch { target = path.join(dist, 'index.html'); }
  const ext = path.extname(target);
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon' };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
  res.end(await readFile(target));
}

export async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    if (!pathname.startsWith('/api/')) return await serveStatic(req, res, pathname);
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) fail(405, 'Method not allowed.');
    if (req.method !== 'GET') checkOrigin(req);
    if (pathname === '/api/health' && req.method === 'GET') {
      await db.command({ ping: 1 });
      return json(res, 200, { ok: true });
    }
    if (pathname === '/api/login' && req.method === 'POST') {
      const { email, password } = await bodyOf(req);
      if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) fail(400, 'Email and password are required.');
      const normalizedEmail = email.trim().toLowerCase();
      const ip = req.socket.remoteAddress;
      const throttleKey = hashToken(`${ip}:${normalizedEmail}`);
      const failures = db.collection('loginFailures');
      const now = new Date();
      const attempt = await failures.findOne({ key: throttleKey });
      if (attempt?.expiresAt > now && attempt.count >= 5) fail(429, 'Too many attempts. Try again in 15 minutes.');
      const user = await db.collection('students').findOne({ email: normalizedEmail });
      if (!user || !(await matchesPassword(user, password))) {
        if (!attempt || attempt.expiresAt <= now) {
          await failures.updateOne({ key: throttleKey }, { $set: { count: 1, expiresAt: new Date(Date.now() + 15 * 60_000) } }, { upsert: true });
        } else {
          await failures.updateOne({ key: throttleKey }, { $inc: { count: 1 } });
        }
        fail(401, 'Invalid email or password.');
      }
      await failures.deleteOne({ key: throttleKey });
      const token = randomBytes(32).toString('hex');
      await db.collection('sessions').insertOne({ tokenHash: hashToken(token), uid: user.uid, expiresAt: new Date(Date.now() + sessionDays * 86400000) });
      return json(res, 200, { user: publicProfile(user) }, { 'Set-Cookie': sessionCookie(token, sessionDays * 86400) });
    }
    const user = await currentUser(req);
    if (!user) fail(401, 'Please sign in.');
    if (pathname === '/api/session' && req.method === 'GET') return json(res, 200, { user: publicProfile(user) });
    if (pathname === '/api/logout' && req.method === 'POST') {
      const token = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
      if (token) await db.collection('sessions').deleteOne({ tokenHash: hashToken(token) });
      return json(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
    }
    if (pathname === '/api/password' && req.method === 'POST') {
      const { currentPassword, newPassword } = await bodyOf(req);
      if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 10 || newPassword.length > 128) fail(400, 'New password must be 10–128 characters.');
      if (!(await matchesPassword(user, currentPassword))) fail(401, 'Current password is incorrect.');
      await db.collection('students').updateOne({ uid: user.uid }, { $set: { passwordHash: await passwordHash(newPassword), passwordChangedAt: new Date() }, $unset: { legacyHashes: '' } });
      await db.collection('sessions').deleteMany({ uid: user.uid });
      return json(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
    }
    if (pathname === '/api/reset' && req.method === 'POST') {
      requireAdmin(user);
      for (const [name, records] of Object.entries(seed)) {
        if (name === 'students') continue;
        await db.collection(name).deleteMany({});
        if (records.length) await db.collection(name).insertMany(records);
      }
      await db.collection('studentAssignments').deleteMany({});
      await db.collection('personalRecords').deleteMany({});
      return json(res, 200, { ok: true });
    }
    const parts = pathname.split('/').filter(Boolean);
    if (parts[1] !== 'collections' || !keys[parts[2]] || parts.length > 4) fail(404, 'Unknown API endpoint.');
    const name = parts[2], keyName = keys[name], collection = db.collection(name);
    const key = parts[3] ? (name === 'academicCalendar' ? Number(parts[3]) : decodeURIComponent(parts[3])) : null;
    if (req.method === 'GET' && parts.length === 3) {
      if (personalCollections.has(name) && user.role !== 'admin') {
        const [shared, personal] = await Promise.all([
          collection.find({ $or: [{ studentId: { $exists: false } }, { studentId: user.uid }] }).limit(5000).toArray(),
          db.collection('personalRecords').find({ collection: name, studentId: user.uid }).limit(5000).toArray(),
        ]);
        return json(res, 200, mergePersonalRecords(shared, personal, keyName).map(safeDocument));
      }
      const query = user.role === 'admin' ? {} : privateCollections.has(name) ? { studentId: user.uid } : name === 'assignments' || name === 'calendarEvents' ? { $or: [{ studentId: { $exists: false } }, { studentId: user.uid }] } : {};
      const docs = await collection.find(query).limit(5000).toArray();
      return json(res, 200, docs.map(name === 'students' ? publicProfile : safeDocument));
    }
    if (req.method === 'GET' && parts.length === 4) {
      let doc = await collection.findOne({ [keyName]: key });
      if (user.role !== 'admin' && personalCollections.has(name)) {
        if (doc?.studentId && doc.studentId !== user.uid) doc = null;
        const personal = await db.collection('personalRecords').findOne({ collection: name, studentId: user.uid, recordKey: key });
        doc = mergePersonalRecords(doc ? [doc] : [], personal ? [personal] : [], keyName)[0];
      }
      if (!doc) fail(404, 'Record not found.');
      if (user.role !== 'admin' && privateCollections.has(name) && doc.studentId !== user.uid) fail(403, 'Access denied.');
      return json(res, 200, name === 'students' ? publicProfile(doc) : safeDocument(doc));
    }
    if (req.method === 'PUT' && parts.length === 3) {
      const record = validateRecord(await bodyOf(req), keyName);
      if (name === 'students') {
        const existing = await collection.findOne({ uid: record.uid });
        if (!existing) requireAdmin(user);
        else if (user.role !== 'admin' && record.uid !== user.uid) fail(403, 'Access denied.');
        if (user.role !== 'admin' && user.dataAccess && user.dataAccess !== 'Full Read & Write') fail(403, 'Your account is read-only.');
        if (existing && record.email !== existing.email) fail(400, 'Account email cannot be changed here.');
        const fields = profileFieldsForUpdate(user, record);
        if (existing) await collection.updateOne({ uid: record.uid }, { $set: fields });
        else await collection.insertOne({ ...record, role: 'student' });
        return json(res, 200, publicProfile(await collection.findOne({ uid: record.uid })));
      }
      if (user.role !== 'admin') {
        if (user.dataAccess && user.dataAccess !== 'Full Read & Write') fail(403, 'Your account is read-only.');
        if (!studentWriteCollections.has(name)) fail(403, 'Administrator access required.');
        if (privateCollections.has(name) && record.studentId !== user.uid) fail(403, 'Access denied.');
        if (personalCollections.has(name)) {
          const shared = await collection.findOne({ [keyName]: record[keyName] });
          if (shared?.studentId && shared.studentId !== user.uid) fail(403, 'Access denied.');
          record.studentId = user.uid;
          await db.collection('personalRecords').updateOne(
            { collection: name, studentId: user.uid, recordKey: record[keyName] },
            { $set: { record, baseRevision: shared?._sharedRevision || null, deleted: false } },
            { upsert: true },
          );
          await syncAttendanceClosure(name, record, [user.uid]);
          return json(res, 200, record);
        }
        if (name === 'calendarEvents') record.studentId = user.uid;
        const old = await collection.findOne({ [keyName]: record[keyName] });
        if (old && old.studentId !== user.uid) fail(403, 'Access denied.');
      }
      if (name === 'attendanceLedger') {
        const statuses = new Set(['Present', 'Absent', 'Off', 'Event', 'Holiday', 'Reset']);
        if (!statuses.has(record.status)) fail(400, 'Invalid attendance status.');
        if (record.automaticClosure || record.closureSource) fail(403, 'Automatic closure records are managed by the calendar.');
        await rejectAttendanceOnClosedClass(record);
      }
      if (personalCollections.has(name)) {
        delete record.studentId;
        record._sharedRevision = randomBytes(16).toString('hex');
      }
      await collection.updateOne({ [keyName]: record[keyName] }, { $set: record, ...(personalCollections.has(name) ? { $unset: { studentId: '' } } : {}) }, { upsert: true });
      if (['calendarEvents', 'holidays'].includes(name)) {
        await syncAttendanceClosure(name, record, await studentIdsForClosure(user));
      }
      return json(res, 200, safeDocument(record));
    }
    if (req.method === 'DELETE' && parts.length === 4) {
      const existing = await collection.findOne({ [keyName]: key });
      if (name === 'attendanceLedger' && existing?.automaticClosure) fail(403, 'Calendar closure records can only be changed by updating the calendar.');
      if (name === 'students') {
        requireAdmin(user);
        if (existing && coreIds.has(existing.uid)) fail(403, 'Core accounts cannot be deleted.');
      } else if (user.role !== 'admin') {
        if (user.dataAccess && user.dataAccess !== 'Full Read & Write') fail(403, 'Your account is read-only.');
        if (personalCollections.has(name)) {
          if (existing?.studentId && existing.studentId !== user.uid) fail(403, 'Access denied.');
          await clearAttendanceClosure(name, key, [user.uid]);
          if (existing) await syncAttendanceClosure(name, existing, [user.uid]);
          await db.collection('personalRecords').updateOne(
            { collection: name, studentId: user.uid, recordKey: key },
            { $set: { baseRevision: existing?._sharedRevision || null, deleted: true }, $unset: { record: '' } },
            { upsert: true },
          );
          return json(res, 200, { ok: true });
        }
        if (!studentWriteCollections.has(name) || !existing || existing.studentId !== user.uid) fail(403, 'Access denied.');
      }
      if (['calendarEvents', 'holidays'].includes(name)) {
        await clearAttendanceClosure(name, key, await studentIdsForClosure(user));
      }
      await collection.deleteOne({ [keyName]: key });
      await db.collection('personalRecords').deleteMany({ collection: name, recordKey: key });
      return json(res, 200, { ok: true });
    }
    if (req.method === 'DELETE' && parts.length === 3) {
      if (user.role !== 'admin' && personalCollections.has(name)) {
        if (user.dataAccess && user.dataAccess !== 'Full Read & Write') fail(403, 'Your account is read-only.');
        const [shared, personal] = await Promise.all([
          collection.find({ $or: [{ studentId: { $exists: false } }, { studentId: user.uid }] }).limit(5000).toArray(),
          db.collection('personalRecords').find({ collection: name, studentId: user.uid }).limit(5000).toArray(),
        ]);
        for (const record of mergePersonalRecords(shared, personal, keyName)) {
          const baseline = shared.find((item) => item[keyName] === record[keyName]);
          await db.collection('personalRecords').updateOne(
            { collection: name, studentId: user.uid, recordKey: record[keyName] },
            { $set: { baseRevision: baseline?._sharedRevision || null, deleted: true }, $unset: { record: '' } },
            { upsert: true },
          );
        }
        return json(res, 200, { ok: true });
      }
      requireAdmin(user);
      if (name === 'students') fail(403, 'Account collection cannot be cleared.');
      if (['calendarEvents', 'holidays'].includes(name)) {
        await db.collection('attendanceLedger').deleteMany({ automaticClosure: true, closureSource: { $regex: `^${name}:` } });
      }
      await collection.deleteMany({});
      await db.collection('personalRecords').deleteMany({ collection: name });
      return json(res, 200, { ok: true });
    }
    fail(405, 'Method not allowed.');
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status === 500) console.error(error);
    json(res, status, { error: status === 500 ? 'Server error.' : error.message });
  }
}
const server = http.createServer(handler);
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop your IDE's Live Server or other app on that port, then retry.`);
  } else {
    console.error(error);
  }
  void client.close().finally(() => process.exit(1));
});
server.listen(port, host, () => {
  console.log(`StudentOS ready at http://localhost:${port}`);
  if (process.env.OPEN_BROWSER === '1' && process.platform === 'win32') {
    const browser = spawn('powershell.exe', [
      '-NoProfile', '-WindowStyle', 'Hidden', '-Command',
      `Start-Process 'http://localhost:${port}'`,
    ], { detached: true, stdio: 'ignore', windowsHide: true });
    browser.on('error', () => console.warn(`Open http://localhost:${port} in your browser.`));
    browser.unref();
  }
});
