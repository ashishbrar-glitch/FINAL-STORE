const fs = require('fs');
const file = 'src/components/admin/AdminProductModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/catch \(e\) \{\n           console\.error\("AI Error:", e\);\n        \}/g, `catch (e: any) {
           if (e.message !== "Failed to fetch") {
              console.error("AI Error:", e);
           }
        }`);

fs.writeFileSync(file, content);
