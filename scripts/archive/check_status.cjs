const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function run() {
  try {
    const firebaseConfig = require('./firebase-applet-config.json');
    initializeApp({ credential: applicationDefault(), projectId: firebaseConfig.projectId });
    const db = getFirestore(undefined, firebaseConfig.firestoreDatabaseId || '(default)');
    const snap = await db.collection('products').get();
    let statuses = {};
    snap.docs.forEach(d => {
       const status = d.data().searchStatus || 'none';
       statuses[status] = (statuses[status] || 0) + 1;
    });
    console.log("Product Statuses:", statuses);
    
    const relSnap = await db.collection('productRelationships').get();
    console.log("Relationships count:", relSnap.size);
  } catch (e) { console.error(e.message); }
}
run();
