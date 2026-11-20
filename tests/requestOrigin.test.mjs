import { test } from 'node:test';
import assert from 'node:assert/strict';
import { originIsAllowed } from '../backend/request-origin.mjs';
test('local HTTPS tunnel accepts its own origin while rejecting unrelated origins', () => {
  const host = 'example-5500.inc1.devtunnels.ms';
  assert.ok(originIsAllowed({ headers: { host, origin: `https://${host}` } }, {}));
  assert.ok(originIsAllowed({ headers: { host: 'localhost:5500', 'x-forwarded-host': host, origin: `https://${host}` } }, {}));
  assert.equal(originIsAllowed({ headers: { host, origin: 'https://unrelated.example' } }, {}), false);
  assert.equal(originIsAllowed({ headers: { host: 'localhost:5500', 'x-forwarded-host': 'unrelated.example', origin: 'https://unrelated.example' } }, {}), false);
});
test('production accepts the configured HTTPS origin and rejects unrelated forwarded origins', () => {
  assert.ok(originIsAllowed({ headers: { host: 'studentos.example', origin: 'https://studentos.example' } }, { APP_ORIGIN: 'https://studentos.example', NODE_ENV: 'production' }));
  assert.equal(originIsAllowed({ headers: { host: 'localhost:5500', 'x-forwarded-host': 'example.inc1.devtunnels.ms', origin: 'https://example.inc1.devtunnels.ms' } }, { NODE_ENV: 'production' }), false);
});
