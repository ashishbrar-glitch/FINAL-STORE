import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Fetching products...");
  const pSnap = await getDocs(collection(db, "products"));
  const products = [];
  pSnap.forEach(d => {
    const data = d.data();
    products.push({
      id: d.id,
      name: data.name || "",
      nameHi: data.nameHi || "",
      category: data.categoryId || data.category || "Uncategorized"
    });
  });
  console.log(`Found ${products.length} products.`);

  console.log("Fetching categories...");
  const cSnap = await getDocs(collection(db, "categories"));
  const categories = [];
  cSnap.forEach(d => {
    const data = d.data();
    categories.push({
      id: d.id,
      nameEn: data.nameEn || "",
      nameHi: data.nameHi || "",
      description: data.description || ""
    });
  });
  console.log(`Found ${categories.length} categories.`);
  
  if (products.length === 0) return;

  console.log("Calling /api/analyze-catalog...");
  const aiRes = await fetch("http://localhost:3000/api/analyze-catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products, categories })
  });
  
  const relations = await aiRes.json();
  console.log("Relations received:", Object.keys(relations).length, "products mapped.");
  
  console.log("Saving to Firestore system/recommendations...");
  await setDoc(doc(db, "system", "recommendations"), { relations, updatedAt: Date.now() });
  
  console.log("Successfully regenerated and saved recommendations!");
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
