const fs = require('fs');
const files = [
  'src/components/admin/AdminProductModal.tsx',
  'src/components/admin/AdminCategoryModal.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /if \(!response\.ok\) throw new Error\("Failed to generate image"\);/g,
    'if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || "Failed to generate image"); }'
  );
  
  content = content.replace(
    /alert\("Failed to generate image\. Please try again\."\);/g,
    'alert(err instanceof Error ? err.message : "Failed to generate image. Please try again.");'
  );
  fs.writeFileSync(file, content);
});
