const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, writeBatch, doc, collection } = require('firebase/firestore');

const config = require('./firebase-applet-config.json');
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || "(default)");

const BATCH_SIZE = 400;

async function runImport() {
  console.log("=== STARTING SEATS IMPORT ===");
  try {
    const data = JSON.parse(fs.readFileSync('bcnstore-backup-2026-09-02.json', 'utf8'));
    const seats = data.seats || [];

    let currentBatch = writeBatch(db);
    let operationCount = 0;
    let batchCount = 0;

    const processItem = async (item, collectionName) => {
      if (!item.id) {
         console.warn(`Skipping item in ${collectionName} with no ID:`, item);
         return;
      }
      const docRef = doc(db, collectionName, item.id);
      
      const dataToWrite = { ...item };
      
      if (dataToWrite.createdAt && dataToWrite.createdAt.seconds) {
         dataToWrite.createdAt = new Date(dataToWrite.createdAt.seconds * 1000);
      }
      if (dataToWrite.updatedAt && dataToWrite.updatedAt.seconds) {
         dataToWrite.updatedAt = new Date(dataToWrite.updatedAt.seconds * 1000);
      }

      currentBatch.set(docRef, dataToWrite, { merge: true });
      operationCount++;

      if (operationCount === BATCH_SIZE) {
        batchCount++;
        console.log(`Committing batch ${batchCount} (${BATCH_SIZE} items)...`);
        await currentBatch.commit();
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    };

    console.log(`Queuing ${seats.length} seats...`);
    for (const seat of seats) {
      await processItem(seat, 'seats');
    }

    if (operationCount > 0) {
      batchCount++;
      console.log(`Committing final batch ${batchCount} (${operationCount} items)...`);
      await currentBatch.commit();
    }

    console.log("=== SEATS IMPORT COMPLETE ===");
  } catch (err) {
    console.error("Error during import:", err.message);
  }
  process.exit(0);
}

runImport();
