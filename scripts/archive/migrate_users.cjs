const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);
const auth = getAuth(app);

async function migrate() {
  const snap = await getDocs(collection(db, 'users'));
  for (const d of snap.docs) {
    const data = d.data();
    if (data.password) {
      console.log(`Migrating ${data.email}...`);
      try {
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const uid = cred.user.uid;
        await setDoc(doc(db, 'users', uid), { email: data.email, role: data.role });
        console.log(`Migrated ${data.email} to ${uid}`);
        await deleteDoc(d.ref); // Delete legacy doc
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
           console.log(`${data.email} already in auth!`);
           // Delete the legacy doc to clean up
           await deleteDoc(d.ref);
        } else {
           console.error("Failed", data.email, err);
        }
      }
    }
  }
  process.exit(0);
}
migrate();
