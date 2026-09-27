const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex1 = /\n\/\/ Initialize Firebase Admin for Secure Server Writes\nlet adminDb = null;\ntry \{\n  const adminApp = initAdminApp\(\{\n    credential: applicationDefault\(\),\n    projectId: firebaseConfig\.projectId\n  \}\);\n  adminDb = getAdminFirestore\(adminApp, firebaseConfig\.firestoreDatabaseId \|\| '\(default\)'\);\n\} catch \(e\) \{\n  console\.error\("Failed to initialize Firebase Admin:", e\);\n\}/s;
const replacement1 = ``;

code = code.replace(regex1, replacement1);

const regex2 = /\/\/ Initialize Firebase for server\nlet db: any = null;\nlet firebaseConfig: any = null;\ntry \{\n  firebaseConfig = JSON\.parse\(fs\.readFileSync\('\.\/firebase-applet-config\.json', 'utf8'\)\);\n  const firebaseApp = initializeApp\(firebaseConfig\);\n  db = getFirestore\(firebaseApp\);\n\} catch \(e\) \{/s;

const replacement2 = `// Initialize Firebase for server
let db: any = null;
let firebaseConfig: any = null;
let adminDb = null;
try {
  firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp);
  
  const adminApp = initAdminApp({
    credential: applicationDefault(),
    projectId: firebaseConfig.projectId
  });
  adminDb = getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId || '(default)');
} catch (e) {`;

code = code.replace(regex2, replacement2);

fs.writeFileSync('server.ts', code);
