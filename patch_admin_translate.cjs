const fs = require('fs');

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import { auth }')) {
    content = content.replace("import { db }", "import { db, auth }");
  }
  
  const target = `const res = await fetch("/api/translate-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },`;
        
  const replacement = `const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/translate-admin", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },`;
        
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
}

patchFile('src/components/admin/AdminProductModal.tsx');
patchFile('src/components/admin/AdminCategoryModal.tsx');
patchFile('src/components/admin/CategoryManagement.tsx');
