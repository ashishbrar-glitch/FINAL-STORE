const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminProductModal.tsx', 'utf-8');

code = code.replace(
  'alert("Error saving product");',
  'alert("Error saving product: " + (err instanceof Error ? err.message : String(err)));'
);

fs.writeFileSync('src/components/admin/AdminProductModal.tsx', code);
