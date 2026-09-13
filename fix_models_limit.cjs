const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replaceAll('gemini-3.6-flash', 'gemini-1.5-flash');

fs.writeFileSync('server.ts', code);
console.log("Updated flash models to 1.5");
