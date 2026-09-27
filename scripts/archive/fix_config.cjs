const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const firebaseConfig = JSON\.parse\(fs\.readFileSync\('\.\/firebase-applet-config\.json', 'utf8'\)\);\n/, '');

fs.writeFileSync('server.ts', code);
