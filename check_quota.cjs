const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  try {
    const q = query(collection(db, 'categories'), limit(1));
    const snap = await getDocs(q);
    console.log("SUCCESS! Docs found:", snap.size);
    process.exit(0);
  } catch (err) {
    console.error("STILL LOCKED:", err.message);
    process.exit(1);
  }
}
check();
