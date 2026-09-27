const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'import { getFirestore, runTransaction, doc } from "firebase/firestore";',
  'import { getFirestore, runTransaction, doc, getDocs, collection } from "firebase/firestore";'
);

code = code.replace(
  'const { getDocs, collection } = require("firebase/firestore");\n      const snap = await getDocs(collection(db, "products"));',
  'const snap = await getDocs(collection(db, "products"));'
);

fs.writeFileSync('server.ts', code);
