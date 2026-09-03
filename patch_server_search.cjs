const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\("\/api\/search", async \(req, res\) => \{[\s\S]*?\}\);\s*/g;
content = content.replace(regex, '');

fs.writeFileSync('server.ts', content);
