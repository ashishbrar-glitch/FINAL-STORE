const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);
getDocs(collection(db, 'users')).then(snap => {
  snap.forEach(d => console.log(d.id, "=>", d.data().email));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
