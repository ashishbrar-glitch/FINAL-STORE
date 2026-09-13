const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('if (currentView === "cart") {'));
const end = lines.findIndex((l, i) => i > start && l === '  }');
console.log(lines.slice(start, end + 1).join('\n'));
