const fs = require('fs');
let code = fs.readFileSync('src/components/admin/CategoryManagement.tsx', 'utf8');

const handleEditRegex = /const handleEdit = \(category: any\) => \{/;
const handleEditReplacement = `const handleEdit = (category: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });`;

code = code.replace(handleEditRegex, handleEditReplacement);
fs.writeFileSync('src/components/admin/CategoryManagement.tsx', code);
console.log("Patched CategoryManagement scroll successfully");
