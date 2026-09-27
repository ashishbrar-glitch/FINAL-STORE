const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminProductModal.tsx', 'utf8');

const regex = /           const snap = await getDocs\(collection\(db, "products"\)\);\n           const catalog = snap\.docs\.map\(d => \(\{ id: d\.id, \.\.\.d\.data\(\) \}\)\);\n           const pData = \{ id: productId, \.\.\.dataToSave \};\n/s;
code = code.replace(regex, '');

fs.writeFileSync('src/components/admin/AdminProductModal.tsx', code);
