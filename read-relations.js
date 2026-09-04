import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const docRef = doc(db, "system", "recommendations");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    console.log(JSON.stringify(data.relations, null, 2));
  } else {
    console.log("No such document!");
  }
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
