const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
try {
  initializeApp();
  const db = getFirestore();
  db.collection('products').limit(1).get().then(snap => {
    console.log("SUCCESS! Admin works. Docs:", snap.docs.length);
  }).catch(err => {
    console.error("FIRESTORE ERROR:", err.message);
  });
} catch (e) {
  console.error("INIT ERROR:", e.message);
}
