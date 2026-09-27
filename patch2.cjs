const fs = require('fs');
const files = [
  'src/components/admin/BackgroundRemovalPOC.tsx',
  'src/components/admin/AdminProductModal.tsx',
  'src/components/admin/AdminCategoryModal.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/src=\{originalPreview!\}/g, 'src={originalPreview || undefined}');
  content = content.replace(/src=\{originalPreview\}/g, 'src={originalPreview || undefined}');
  content = content.replace(/src=\{finalBase64\}/g, 'src={finalBase64 || undefined}');
  content = content.replace(/src=\{generatedPreview\}/g, 'src={generatedPreview || undefined}');
  fs.writeFileSync(file, content);
}
