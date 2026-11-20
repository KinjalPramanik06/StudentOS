/** MongoDB-backed API adapter. The browser never receives database credentials. */
const STORES = ['students', 'subjects', 'timetable', 'attendance', 'attendanceLedger', 'marks', 'semesterResults', 'holidays', 'calendarEvents', 'assignments', 'notices', 'academicCalendar', 'settings'] as const;

export class StorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new StorageError('Cannot reach the StudentOS server. Check that it is running.', error);
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new StorageError(result.error || (response.status >= 500
    ? 'Cannot reach the StudentOS server. Check that it is running.'
    : `Server error (${response.status}).`));
  return result as T;
}

function collectionPath(storeName: string): string {
  if (!STORES.includes(storeName as typeof STORES[number])) throw new StorageError('Unknown collection.');
  return `/collections/${storeName}`;
}
export const create = <T>(storeName: string, record: T): Promise<T> => api(collectionPath(storeName), 'PUT', record);
export const update = create;
export const read = <T>(storeName: string, key: IDBValidKey): Promise<T | null> =>
  api<T>(`${collectionPath(storeName)}/${encodeURIComponent(String(key))}`).catch((error) => {
    if (error instanceof StorageError && error.message === 'Record not found.') return null;
    throw error;
  });
export const del = (storeName: string, key: IDBValidKey): Promise<void> =>
  api(`${collectionPath(storeName)}/${encodeURIComponent(String(key))}`, 'DELETE').then(() => undefined);
export const getAll = <T>(storeName: string): Promise<T[]> => api<T[]>(collectionPath(storeName));
export const find = async <T>(storeName: string, predicate: (record: T) => boolean): Promise<T[]> =>
  (await getAll<T>(storeName)).filter(predicate);
export const findByIndex = async <T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> =>
  find<T>(storeName, (record) => (record as Record<string, unknown>)[indexName] === value);
export const clear = (storeName: string): Promise<void> => api(collectionPath(storeName), 'DELETE').then(() => undefined);
export async function clearAll(): Promise<void> {
  for (const name of STORES) if (name !== 'students') await clear(name);
}

export interface DatabaseHealthReport {
  success: boolean;
  storeCounts: Record<string, number>;
  totalRecords: number;
  error?: string;
}
export async function verifyDatabaseHealth(): Promise<DatabaseHealthReport> {
  const storeCounts: Record<string, number> = {};
  try {
    await api('/health');
    for (const name of STORES) storeCounts[name] = (await getAll(name)).length;
    return { success: true, storeCounts, totalRecords: Object.values(storeCounts).reduce((a, b) => a + b, 0) };
  } catch (error) {
    return { success: false, storeCounts, totalRecords: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
export interface StudentOSBackup {
  meta: { app: 'StudentOS'; exportedAt: string; dbName: string; dbVersion: number };
  data: Record<string, unknown[]>;
}
export async function exportAll(): Promise<StudentOSBackup> {
  const data: Record<string, unknown[]> = {};
  for (const name of STORES) data[name] = await getAll(name);
  return { meta: { app: 'StudentOS', exportedAt: new Date().toISOString(), dbName: 'studentos', dbVersion: 2 }, data };
}
export async function exportToFile(): Promise<void> {
  const blob = new Blob([JSON.stringify(await exportAll(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `studentos-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
export function validateBackup(value: unknown): value is StudentOSBackup {
  if (!value || typeof value !== 'object') return false;
  const backup = value as StudentOSBackup;
  return backup.meta?.app === 'StudentOS' && !!backup.data && typeof backup.data === 'object' &&
    Object.entries(backup.data).every(([name, rows]) => STORES.includes(name as typeof STORES[number]) && Array.isArray(rows));
}
export async function importAll(backup: StudentOSBackup): Promise<void> {
  if (!validateBackup(backup)) throw new StorageError('Invalid StudentOS backup.');
  for (const [name, rows] of Object.entries(backup.data)) {
    if (name === 'students') continue; // Imported profiles must not replace server credentials or roles.
    await clear(name);
    for (const row of rows) await create(name, row);
  }
}
export async function readBackupFile(file: File): Promise<StudentOSBackup> {
  const parsed = JSON.parse(await file.text());
  if (!validateBackup(parsed)) throw new StorageError('Invalid StudentOS backup.');
  return parsed;
}
