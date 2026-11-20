import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergePersonalRecords } from '../backend/personal-records.mjs';

test('private edits, additions and deletions leave the shared baseline intact', () => {
  const shared = [{ id: 'a', name: 'Shared' }, { id: 'b', name: 'Other' }];
  const own = [
    { recordKey: 'a', baseRevision: null, record: { id: 'a', name: 'My copy' } },
    { recordKey: 'b', baseRevision: null, deleted: true },
    { recordKey: 'c', baseRevision: null, record: { id: 'c', name: 'My new record' } },
  ];
  assert.deepEqual(mergePersonalRecords(shared, own, 'id').map((r) => r.name), ['My copy', 'My new record']);
  assert.deepEqual(mergePersonalRecords(shared, [], 'id'), shared);
  assert.equal(shared[0].name, 'Shared');
});

test('an admin publication replaces older personal edits and deletions', () => {
  const shared = [{ id: 3, name: 'Admin publication', _sharedRevision: 'new' }];
  for (const override of [{ record: { id: 3, name: 'Old copy' } }, { deleted: true }]) {
    assert.equal(mergePersonalRecords(shared, [{ recordKey: 3, baseRevision: null, ...override }], 'id')[0].name, 'Admin publication');
  }
  assert.equal(mergePersonalRecords(shared, [{ recordKey: 3, baseRevision: 'new', record: { id: 3, name: 'New personal edit' } }], 'id')[0].name, 'New personal edit');
});
