const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /app\.post\("\/api\/generate-image", async \(req, res\) => \{[\s\S]*?\}\);/g;
content = content.replace(regex, '');

fs.writeFileSync(file, content);
console.log("Patched server.ts (removed generate image API)");
