const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

const targetStr = `import { getFirestore } from 'firebase/firestore';`;
const replaceStr = `import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
}

const targetStr2 = `export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);`;

const replaceStr2 = `export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence so the app works even when quota is exceeded
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code == 'unimplemented') {
    console.warn('The current browser does not support offline persistence.');
  }
});

export const auth = getAuth(app);
export const storage = getStorage(app);`;

if (code.includes(targetStr2)) {
  code = code.replace(targetStr2, replaceStr2);
  fs.writeFileSync('src/lib/firebase.ts', code);
  console.log("Patched firebase.ts successfully");
} else {
  console.log("Could not find target strings in firebase.ts");
}
