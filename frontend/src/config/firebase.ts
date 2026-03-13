import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Firebase configuration - env vars at build time, fallback for Electron desktop app
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyBJqu8TZQsoqiCV-OH6NyICY6r5xgWrfjE',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'stock-management-system-6c00d.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'stock-management-system-6c00d',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'stock-management-system-6c00d.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '1090868293851',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:1090868293851:web:fb697c15a2d42407c65cfe',
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Missing Firebase config. Create .env or .env.production with REACT_APP_FIREBASE_* variables. See .env.example for reference.'
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Use long-polling for better compatibility (Electron, corporate firewalls, proxies)
// WebSockets often fail in packaged Electron apps and restricted networks
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });

// Enable offline persistence to reduce reads (cached data served from IndexedDB)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: multiple tabs open. Using memory cache.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not supported in this browser.');
  }
});

// Initialize Firebase services
export const auth = getAuth(app);

export default app;
