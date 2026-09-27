const fs = require('fs');
const code = fs.readFileSync('server/aiWorker.ts', 'utf8');
console.log(code.substring(12000, 16000));
