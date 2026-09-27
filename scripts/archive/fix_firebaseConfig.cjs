const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`// Initialize Firebase Admin for Secure Server Writes
let adminDb = null;
try {
  const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));`,
`// Initialize Firebase Admin for Secure Server Writes
let adminDb = null;
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
try {`
);

fs.writeFileSync('server.ts', code);
