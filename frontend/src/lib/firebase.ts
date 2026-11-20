import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';

/** Optional Firebase Web SDK setup. MongoDB continues to own login and app data. */
export function initializeFirebase(): FirebaseApp | null {
  if (import.meta.env.VITE_FIREBASE_ENABLED !== 'true') return null;
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  if (!config.apiKey || !config.projectId || !config.appId) {
    throw new Error('Firebase is enabled but its web configuration is incomplete. See .env.example.');
  }
  return getApps().length ? getApp() : initializeApp(config);
}
