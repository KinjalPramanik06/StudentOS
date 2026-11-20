import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { deleteApp } from 'firebase/app';

async function loadSetup(env) {
  const source = await readFile(new URL('../frontend/src/lib/firebase.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
    .replaceAll("'firebase/app'", JSON.stringify(import.meta.resolve('firebase/app')))
    .replaceAll('import.meta.env', JSON.stringify(env));
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
test('Firebase remains optional and disabled without configuration', async () => {
  const { initializeFirebase } = await loadSetup({});
  assert.equal(initializeFirebase(), null);
});
test('enabled Firebase rejects incomplete configuration', async () => {
  const { initializeFirebase } = await loadSetup({ VITE_FIREBASE_ENABLED: 'true' });
  assert.throws(initializeFirebase, /incomplete/);
});
test('Firebase initializes once from supplied config without enabling any services', async () => {
  const { initializeFirebase } = await loadSetup({
    VITE_FIREBASE_ENABLED: 'true', VITE_FIREBASE_API_KEY: 'test-only-key',
    VITE_FIREBASE_PROJECT_ID: 'test-only-project', VITE_FIREBASE_APP_ID: 'test-only-app',
  });
  const app = initializeFirebase();
  assert.equal(app.options.projectId, 'test-only-project');
  assert.equal(initializeFirebase(), app);
  await deleteApp(app);
});
