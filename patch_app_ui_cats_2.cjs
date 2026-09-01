const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\s*isAdmin\s*&&\s*\(\s*<div\s*className="flex flex-col items-center gap-2 cursor-pointer relative shrink-0 min-w-\[56px\]"\s*onClick=\{\(\) => setEditingCategory\("new"\)\}\s*>[\s\S]*?<\/div>\s*\)\s*\}/m;

code = code.replace(regex, '');
fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx category UI 2 successfully");
