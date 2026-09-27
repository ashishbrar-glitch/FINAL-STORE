const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldEffect = /  useEffect\(\(\) => \{\n    if \(true\) \{\n      setCrossSellSource\(null\);\n    \}\n  \}, \[currentView\]\);/s;

code = code.replace(oldEffect, '');
fs.writeFileSync('src/App.tsx', code);
