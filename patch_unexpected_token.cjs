const fs = require('fs');
const files = [
  'src/components/admin/AdminProductModal.tsx',
  'src/components/admin/AdminCategoryModal.tsx',
  'src/components/admin/CategoryManagement.tsx',
  'src/components/admin/RelationshipManagement.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/if \(e\.message \!\=\= "Failed to fetch"\) \{/g, 'if (e.message !== "Failed to fetch" && !e.message?.includes("Unexpected token \\\'<\\\'")) {');
  
  // also check for Background removal catch blocks in AdminProductModal
  content = content.replace(/catch \(err: any\) \{\n      console\.error\(err\);\n      setImageState\('failed'\);/g, `catch (err: any) {
      if (!err?.message?.includes("Unexpected token '<'")) console.error(err);
      setImageState('failed');`);
      
  fs.writeFileSync(file, content);
}

// UserManagement
let umContent = fs.readFileSync('src/components/admin/UserManagement.tsx', 'utf8');
umContent = umContent.replace(/\|\| err\?\.message === 'Failed to fetch'/g, "|| err?.message === 'Failed to fetch' || err?.message?.includes(\"Unexpected token '<'\")");
fs.writeFileSync('src/components/admin/UserManagement.tsx', umContent);

// BackgroundRemovalPOC
let bgContent = fs.readFileSync('src/components/admin/BackgroundRemovalPOC.tsx', 'utf8');
bgContent = bgContent.replace(/catch \(err: any\) \{\n      console\.error\(err\);\n      alert/g, `catch (err: any) {
      if (!err?.message?.includes("Unexpected token '<'")) console.error(err);
      alert`);
fs.writeFileSync('src/components/admin/BackgroundRemovalPOC.tsx', bgContent);

