// Shared academic records form a baseline; personal edits never mutate it.
export const personalCollections = new Set([
  'subjects', 'timetable', 'holidays', 'calendarEvents', 'assignments',
  'academicCalendar', 'settings', 'notices',
]);

export function mergePersonalRecords(shared, personal, keyName) {
  const result = new Map(shared.map((record) => [record[keyName], record]));
  for (const override of personal) {
    const baseline = result.get(override.recordKey);
    // A later admin publication supersedes an older personal copy.
    if ((baseline?._sharedRevision || null) !== override.baseRevision) continue;
    if (override.deleted) result.delete(override.recordKey);
    else result.set(override.recordKey, override.record);
  }
  return [...result.values()];
}
