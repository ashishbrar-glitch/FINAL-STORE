import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence so the app works even when quota is exceeded
enableIndexedDbPersistence(db).catch(async (err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code == 'unimplemented') {
    console.warn('The current browser does not support offline persistence.');
  } else if (err.code === 'permission-denied') {
    console.error('Permission denied on persistence. Clearing cache...');
    import('firebase/firestore').then(({ clearIndexedDbPersistence }) => {
      clearIndexedDbPersistence(db).then(() => window.location.reload());
    });
  }
});

export const auth = getAuth(app);
export const storage = getStorage(app);
