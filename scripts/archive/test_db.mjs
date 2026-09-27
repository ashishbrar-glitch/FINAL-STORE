import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    const snap = await getDocs(collection(db, "seats"));
    console.log("Success! Seats count:", snap.size);
    process.exit(0);
  } catch(e) {
    console.error("Error:", e.code, e.message);
    process.exit(1);
  }
}
test();
