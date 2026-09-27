const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function run() {
  try {
    const firebaseConfig = require('./firebase-applet-config.json');
    initializeApp({ credential: applicationDefault(), projectId: firebaseConfig.projectId });
    const db = getFirestore(undefined, firebaseConfig.firestoreDatabaseId || '(default)');
    
    const snap = await db.collection('productRelationships').get();
    let migratedCount = 0;
    
    for (const doc of snap.docs) {
       const data = doc.data();
       if (!data.participants || data.participants.length !== 2) continue;
       
       const [A, B] = data.participants;
       
       const newId = `${A}_${B}`;
       const newRef = db.collection('productRecommendations').doc(newId);
       
       const newDoc = await newRef.get();
       if (newDoc.exists) continue; // Do not overwrite
       
       const newFields = {
          sourceProductId: A,
          targetProductId: B,
          type: data.type || 'similar',
          placement: data.type === 'complementary' ? 'goes_well_with' : 'similar_products',
          confidence: data.confidence || 0.8,
          priority: data.type === 'complementary' ? 80 : 50,
          categoryFit: 0.8,
          priceFit: 0.8,
          bestsellerBoost: 0,
          status: data.status || 'pending',
          source: data.source || 'ai',
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now()
       };
       
       await newRef.set(newFields);
       migratedCount++;
    }
    
    console.log(`Migration complete. Migrated ${migratedCount} relationships to productRecommendations.`);
  } catch (e) { 
    console.error(e.message); 
  }
}
run();
