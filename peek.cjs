const fs = require('fs');
const code = fs.readFileSync('server/aiWorker.ts', 'utf8');
console.log(code.substring(0, 3000));
