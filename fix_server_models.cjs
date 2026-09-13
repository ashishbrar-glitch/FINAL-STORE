const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Replace gemini-3.1-flash-lite and gemini-3.8-flash and gemini-3.6-flash
code = code.replace(/gemini-3\.1-flash-lite/g, 'gemini-2.5-flash');
code = code.replace(/gemini-3\.8-flash/g, 'gemini-2.5-pro');
code = code.replace(/gemini-3\.6-flash/g, 'gemini-2.5-flash');

fs.writeFileSync('server.ts', code);
