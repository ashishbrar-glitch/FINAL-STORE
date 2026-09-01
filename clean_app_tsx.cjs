const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex1 = /\{\s*editingCategory\s*&&\s*\([\s\S]*?onSaved=\{\(\) => \{ setEditingCategory\(null\); fetchData\(\); \}\}\s*\/>\s*\)\s*\}/m;
const regex2 = /\{\s*editingProduct\s*&&\s*\([\s\S]*?onSaved=\{\(\) => \{ setEditingProduct\(null\); fetchData\(\); \}\}\s*\/>\s*\)\s*\}/m;

code = code.replace(regex1, '');
code = code.replace(regex2, '');

fs.writeFileSync('src/App.tsx', code);
console.log("Cleaned up modals in App.tsx");
