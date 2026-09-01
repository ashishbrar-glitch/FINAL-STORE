const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function backup() {
  try {
    console.log("Fetching categories...");
    const catSnap = await getDocs(collection(db, 'categories'));
    const categories = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    console.log("Fetching products...");
    const prodSnap = await getDocs(collection(db, 'products'));
    const products = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const backupData = { categories, products };
    fs.writeFileSync('backup.json', JSON.stringify(backupData, null, 2));
    console.log("Backup successful! Categories:", categories.length, "Products:", products.length);
  } catch (err) {
    console.error("Backup failed:", err.message);
  }
}
backup();
