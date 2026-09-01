const fs = require('fs');
let code = fs.readFileSync('src/components/admin/InventoryManagement.tsx', 'utf8');

const handleEditRegex = /const handleEdit = \(product: any\) => \{/;
const handleEditReplacement = `const handleEdit = (product: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });`;

code = code.replace(handleEditRegex, handleEditReplacement);
fs.writeFileSync('src/components/admin/InventoryManagement.tsx', code);
console.log("Patched InventoryManagement scroll successfully");
