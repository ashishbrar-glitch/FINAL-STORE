const fs = require('fs');
let code = fs.readFileSync('src/seed.ts', 'utf8');

code = code.replace(/password: 'password123',/, '');
code = code.replace(/console\.log\("Superadmin created: admin@bcnstore\.com \/ password123"\);/, 'console.log("Superadmin created: admin@bcnstore.com");');

fs.writeFileSync('src/seed.ts', code);
