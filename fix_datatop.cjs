const fs = require('fs');
const file = 'src/components/admin/AdminProductModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'isAvailable,',
  'isAvailable,\n        isBestseller,'
);

fs.writeFileSync(file, content);
