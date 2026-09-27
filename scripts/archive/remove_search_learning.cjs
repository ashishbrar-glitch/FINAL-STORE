const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ LEARNING ONLY \(non-authoritative\)[\s\S]*?app\.post\("\/api\/translate-admin", /;

if (regex.test(code)) {
  code = code.replace(regex, 'app.post("/api/translate-admin", ');
  fs.writeFileSync('server.ts', code);
  console.log('Removed /api/search-learning from server.ts');
} else {
  console.log('Could not find /api/search-learning');
}
