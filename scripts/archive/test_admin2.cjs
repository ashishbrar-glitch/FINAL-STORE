const fs = require('fs');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
try {
  initializeApp({ projectId: config.projectId });
  const db = getFirestore();
  db.collection('products').limit(1).get().then(snap => {
    console.log("SUCCESS! Admin works with explicit projectId.");
  }).catch(err => {
    console.error("FIRESTORE ERROR:", err.message);
  });
} catch (e) {
  console.error("INIT ERROR:", e.message);
}
