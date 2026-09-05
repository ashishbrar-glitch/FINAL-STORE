const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `  const recommendedIds = recommendations[sourceProduct.id] || [];
  const recommendedProducts = recommendedIds
    .map(id => products.find(p => p.id === id))
    .filter(Boolean) as Product[];

  if (recommendedProducts.length === 0) return null;`;

const replaceStr = `  const recommendedIds = recommendations[sourceProduct.id] || [];
  let recommendedProducts = recommendedIds
    .map(id => products.find(p => p.id === id))
    .filter(Boolean) as Product[];

  if (recommendedProducts.length === 0) {
    recommendedProducts = products.filter(p => p.isBestseller && p.id !== sourceProduct.id).slice(0, 2);
  }
  if (recommendedProducts.length === 0) {
    recommendedProducts = products.filter(p => p.id !== sourceProduct.id).slice(0, 2);
  }

  if (recommendedProducts.length === 0) return null;`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
