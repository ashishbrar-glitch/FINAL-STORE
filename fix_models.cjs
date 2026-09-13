const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replaceAll('gemini-1.5-flash', 'gemini-3.1-flash-lite');

fs.writeFileSync('server.ts', code);
console.log("Updated flash models to 3.1-flash-lite");
