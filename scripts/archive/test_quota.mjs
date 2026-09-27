import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    const snap = await getDocs(collection(db, "seats"));
    console.log("SUCCESS_SEATS", snap.size);
    const snap2 = await getDocs(collection(db, "categories"));
    console.log("SUCCESS_CATEGORIES", snap2.size);
    console.log("QUOTA_CHECK_PASSED");
    process.exit(0);
  } catch(e) {
    console.error("ERROR", e.code, e.message);
    process.exit(1);
  }
}
test();
