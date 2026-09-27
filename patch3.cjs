const fs = require('fs');

let file = 'src/components/admin/CategoryManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace cat.imageUrl -> cat.imageUrl || undefined
content = content.replace(/<img src=\{cat\.imageUrl\} className="w-full h-full object-cover" alt="" \/>/g, 
  '<img src={cat.imageUrl || undefined} className="w-full h-full object-cover" alt="" />');

content = content.replace(/src=\{imagePreview\}/g, 'src={imagePreview || undefined}');

fs.writeFileSync(file, content);

let file2 = 'src/components/admin/InventoryManagement.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(/src=\{product\.imageUrl\}/g, 'src={product.imageUrl || undefined}');
content2 = content2.replace(/src=\{p\.image\}/g, 'src={p.image || undefined}');
fs.writeFileSync(file2, content2);
