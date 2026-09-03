const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add stable random weight generator
const randomCode = `const randomOffsets: Record<string, number> = {};
function getSortWeight(id: string) {
  if (randomOffsets[id] === undefined) {
    randomOffsets[id] = Math.random();
  }
  return randomOffsets[id];
}
`;

if (!content.includes('randomOffsets')) {
  content = content.replace(
    'const BOYS_SEATS = Array.from({ length: 38 }, (_, i) => \`B\${i + 34}\`);',
    'const BOYS_SEATS = Array.from({ length: 38 }, (_, i) => \`B\${i + 34}\`);\n\n' + randomCode
  );
}

// 2. Add sort to processData
const targetSort = `      const prodList = currentProdSnap.docs.map((doc: any, idx: number) => {`;
const replaceSort = `      const prodList = currentProdSnap.docs.map((doc: any, idx: number) => {`;

const targetSetProducts = `      setProducts(prodList);
      setDisplayedProducts(prodList);`;

const replaceSetProducts = `      // Sort items randomly but stably per page load
      prodList.sort((a, b) => getSortWeight(a.id) - getSortWeight(b.id));
      
      setProducts(prodList);
      setDisplayedProducts(prodList);`;

if (!content.includes('getSortWeight(a.id)')) {
  content = content.replace(targetSetProducts, replaceSetProducts);
}

fs.writeFileSync(file, content);
console.log("Patched App.tsx with random ordering");
