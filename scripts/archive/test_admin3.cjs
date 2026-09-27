const fs = require('fs');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
initializeApp({ projectId: config.projectId });
const db = getFirestore();
db.listCollections().then(cols => {
  console.log("SUCCESS Collections:", cols.map(c => c.id));
}).catch(err => {
  console.error("FIRESTORE ERROR:", err.message);
});
