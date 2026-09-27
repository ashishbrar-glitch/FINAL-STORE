const fs = require('fs');

const files = [
  'src/components/admin/BackgroundRemovalPOC.tsx',
  'src/components/admin/AdminProductModal.tsx',
  'src/components/admin/AdminCategoryModal.tsx',
  'src/components/admin/RelationshipManagement.tsx',
  'src/components/admin/InventoryManagement.tsx',
  'src/components/admin/CategoryManagement.tsx',
  'src/App.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Fix RelationshipManagement (p1.image and p2.image)
  if (file.includes('RelationshipManagement')) {
     content = content.replace(
       /p1\.image \? p1\.image : <img src=\{p1\.image\}/g,
       "p1.image ? p1.image : <img src={p1.image || undefined}"
     ); // Wait, the current regex in RM is different.
  }
}
