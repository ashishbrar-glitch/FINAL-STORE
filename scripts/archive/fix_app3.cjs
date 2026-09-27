const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /       const results = Array\.from\(bestCandidates\.values\(\)\);\n             seenTargetIds\.add\(rel\.targetProductId\);\n          \}\n       \}\);/s;
const replacement = `       const results = Array.from(bestCandidates.values());`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
