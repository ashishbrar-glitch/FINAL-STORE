const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Fix buy again section mrp logic
code = code.replace(
  /\{product\.mrp && product\.mrp > product\.price && \(/g,
  '{(product.mrp || 0) > product.price && ('
);

// Fix product element mrp logic
code = code.replace(
  /\{prod\.mrp && prod\.mrp > prod\.price && \(/g,
  '{(prod.mrp || 0) > prod.price && ('
);

fs.writeFileSync('src/App.tsx', code);
