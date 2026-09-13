const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/\}\(recProd, true\)\);/g, '})(recProd, true));');
code = code.replace(/\}\(product, false\);/g, '})(product, false);');

fs.writeFileSync('src/App.tsx', code);
