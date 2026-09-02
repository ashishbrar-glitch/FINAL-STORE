const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, writeBatch, doc } = require('firebase/firestore');

const config = require('./firebase-applet-config.json');
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || "(default)");

const BATCH_SIZE = 400;

async function analyze() {
  console.log("=== IMPORT ANALYSIS ===");
  try {
    const data = JSON.parse(fs.readFileSync('bcnstore-backup-2026-09-02.json', 'utf8'));
    const categories = data.categories || [];
    const products = data.products || [];

    console.log(`Found ${categories.length} categories to import.`);
    console.log(`Found ${products.length} products to import.`);
    
    console.log("\nImport Strategy:");
    console.log("1. Use Firebase writeBatch() to group operations in batches of " + BATCH_SIZE);
    console.log("2. For each category and product, use setDoc(..., { merge: true })");
    console.log("   - This ensures existing documents with the same ID are updated safely,");
    console.log("     preserving fields not explicitly present in the backup (if any).");
    console.log("   - Existing IDs are strictly preserved from the backup.");
    console.log("   - Base64 image fields, prices, stock, and timestamps are imported verbatim.");
    console.log("\nRun this script with '--import' argument to execute the database writes:");
    console.log("node import_backup.cjs --import");
  } catch (err) {
    console.error("Error analyzing backup:", err.message);
  }
  process.exit(0);
}

async function runImport() {
  console.log("=== STARTING IMPORT ===");
  try {
    const data = JSON.parse(fs.readFileSync('bcnstore-backup-2026-09-02.json', 'utf8'));
    const categories = data.categories || [];
    const products = data.products || [];

    let currentBatch = writeBatch(db);
    let operationCount = 0;
    let batchCount = 0;

    const processItem = async (item, collectionName) => {
      if (!item.id) {
         console.warn(`Skipping item in ${collectionName} with no ID:`, item.name);
         return;
      }
      const docRef = doc(db, collectionName, item.id);
      
      const dataToWrite = { ...item };
      
      // Convert older timestamp objects to Dates so Firestore saves them as Timestamps
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

    console.log(`Queuing ${categories.length} categories...`);
    for (const cat of categories) {
      await processItem(cat, 'categories');
    }

    console.log(`Queuing ${products.length} products...`);
    for (const prod of products) {
      await processItem(prod, 'products');
    }

    if (operationCount > 0) {
      batchCount++;
      console.log(`Committing final batch ${batchCount} (${operationCount} items)...`);
      await currentBatch.commit();
    }

    console.log("=== IMPORT COMPLETE ===");
  } catch (err) {
    console.error("Error during import:", err.message);
  }
  process.exit(0);
}

const args = process.argv.slice(2);
if (args.includes('--import')) {
  runImport();
} else {
  analyze();
}
