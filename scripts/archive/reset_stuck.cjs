const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function run() {
  try {
    const firebaseConfig = require('./firebase-applet-config.json');
    initializeApp({ credential: applicationDefault(), projectId: firebaseConfig.projectId });
    const db = getFirestore(undefined, firebaseConfig.firestoreDatabaseId || '(default)');
    
    const snap = await db.collection('products').where('searchStatus', '==', 'processing').get();
    
    let resetCount = 0;
    const batch = db.batch();
    
    snap.docs.forEach(doc => {
       batch.update(doc.ref, { searchStatus: 'none', processingStartedAt: null });
       resetCount++;
    });
    
    if (resetCount > 0) {
      await batch.commit();
      console.log(`Successfully reset ${resetCount} stuck items.`);
    } else {
      console.log('No stuck items found.');
    }
    
  } catch (e) { 
    console.error(e.message); 
  }
}
run();
