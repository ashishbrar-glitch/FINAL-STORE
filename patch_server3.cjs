const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('model: "gemini-3.1-flash-image"', 'model: "gemini-3.1-flash-lite-image"');

fs.writeFileSync(file, content);
console.log("Patched server.ts to gemini-3.1-flash-lite-image");
