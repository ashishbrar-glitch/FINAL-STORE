const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// The replacement was:
// const productElement = (prod, isRec = false) => { ... }(product, false);
// Change it to:
// const productElement = ((prod, isRec = false) => { ... })(product, false);

code = code.replace(/const productElement = \(prod, isRec = false\) => {/g, 'const productElement = ((prod, isRec = false) => {');
code = code.replace(/}\(product, false\);/g, '})(product, false);');
code = code.replace(/recElements = topRecommendations\.map\(recProd => \(prod, isRec = false\) => {/g, 'recElements = topRecommendations.map(recProd => ((prod, isRec = false) => {');
code = code.replace(/}\(recProd, true\)\);/g, '})(recProd, true));');

fs.writeFileSync('src/App.tsx', code);
