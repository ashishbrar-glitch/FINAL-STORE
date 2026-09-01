const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const updateRegex = /const updateQuantity = \(id: string, delta: number\) => \{\s*setCart\(\(prev\) => \{\s*const existing = prev\.find\(\(item\) => item\.id === id\);/;

const updateReplace = `const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const product = products.find(p => p.id === id);
      if (product && product.isAvailable === false && delta > 0) {
        return prev; // Block adding out of stock items
      }
      const existing = prev.find((item) => item.id === id);`;

if (code.includes('const updateQuantity = (id: string, delta: number) => {')) {
  code = code.replace(updateRegex, updateReplace);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched updateQuantity successfully");
} else {
  console.log("Could not find updateQuantity");
}
