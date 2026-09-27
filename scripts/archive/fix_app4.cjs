const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /       const results: \{ product: Product, rel: ProductRecommendation \}\[\] = \[\];\n/s;
const replacement = ``;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
