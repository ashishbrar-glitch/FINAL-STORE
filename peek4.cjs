const fs = require('fs');
const code = fs.readFileSync('server/aiWorker.ts', 'utf8');
console.log(code.substring(9000, 12000));
