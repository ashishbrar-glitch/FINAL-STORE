const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /  app\.get\("\/api\/debug-status", async \(req, res\) => \{[\s\S]*?  \}\);\n/s;
code = code.replace(regex, '');

fs.writeFileSync('server.ts', code);
