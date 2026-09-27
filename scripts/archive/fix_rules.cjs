const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(/allow read, write: if isManager\(\); \/\/ Deprecated, admin only/, 'allow read, write: if false; // Deprecated, backend only migration');

fs.writeFileSync('firestore.rules', code);
