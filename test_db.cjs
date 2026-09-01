const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);

async function test(dbId) {
  try {
    const db = getFirestore(app, dbId);
    const q = query(collection(db, 'categories'), limit(1));
    await getDocs(q);
    console.log("SUCCESS for", dbId);
  } catch (err) {
    console.error("FAILED for", dbId, err.message);
  }
}

async function run() {
  await test(config.firestoreDatabaseId);
  await test("(default)");
  process.exit(0);
}
run();
