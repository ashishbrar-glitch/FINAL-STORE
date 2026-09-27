const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/import \{ getFirestore as getAdminFirestore, FieldValue \} from "firebase-admin\/firestore";/, 'import { getFirestore as getAdminFirestore, FieldValue } from "firebase-admin/firestore";\nimport { getAuth as getAdminAuth } from "firebase-admin/auth";');

code = code.replace(/let adminDb = null;/, 'let adminDb = null;\nlet adminAuth: any = null;');
code = code.replace(/adminDb = getAdminFirestore\(adminApp, firebaseConfig\.firestoreDatabaseId \|\| '\(default\)'\);/, 'adminDb = getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId || \'(default)\');\n  adminAuth = getAdminAuth(adminApp);');

fs.writeFileSync('server.ts', code);
