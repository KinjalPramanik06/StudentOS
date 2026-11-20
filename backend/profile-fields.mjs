// Self-service profile edits must never change account identity or permissions.
export function profileFieldsForUpdate(user, record) {
  if (user.role === 'admin') return record;
  const editable = ['name', 'phone', 'photoURL', 'bloodGroup', 'rollNumber', 'regNumber', 'univRollNumber'];
  return Object.fromEntries(editable.filter((field) => field in record).map((field) => [field, record[field]]));
}
