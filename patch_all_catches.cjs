const fs = require('fs');
const files = [
  'src/components/admin/AdminProductModal.tsx',
  'src/components/admin/AdminCategoryModal.tsx',
  'src/components/admin/CategoryManagement.tsx',
  'src/components/admin/RelationshipManagement.tsx',
  'src/components/admin/UserManagement.tsx',
  'src/components/admin/BackgroundRemovalPOC.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace setError(err.message) if inside the ignored conditions
  content = content.replace(/if \(\!\(err\?\.code === 'resource-exhausted' \|\| err\?\.message\?\.toLowerCase\(\)\.includes\('quota'\) \|\| err\?\.message === 'Failed to fetch' \|\| err\?\.message\?\.includes\("Unexpected token '<'"\)\)\) console\.error\(err\);\n      setError\(err\.message\);/g, `if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota') || err?.message === 'Failed to fetch' || err?.message?.includes("Unexpected token '<'"))) {
        console.error(err);
        setError(err.message);
      }`);
      
  // Replace alert in handleDeleteUser
  content = content.replace(/catch \(err: any\) \{\n      alert\("Error deleting user: " \+ err\.message\);\n    \}/g, `catch (err: any) {
      if (!err?.message?.includes("Unexpected token '<'") && err.message !== "Failed to fetch") {
        alert("Error deleting user: " + err.message);
      }
    }`);
    
  fs.writeFileSync(file, content);
}
