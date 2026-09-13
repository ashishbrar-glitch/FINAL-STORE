const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldMiniSearch = `AI Deep Search...</span>`;
const newMiniSearch = `AI is searching the aisles... 🏃💨</span>`;

code = code.replace(oldMiniSearch, newMiniSearch);

fs.writeFileSync('src/App.tsx', code);
