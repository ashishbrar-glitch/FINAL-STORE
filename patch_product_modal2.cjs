const fs = require('fs');
const file = 'src/components/admin/AdminProductModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/catch \(e\) \{\n      console\.error\(e\);\n      alert\("Failed to auto-translate\. Please enter manually\."\);\n    \}/g, `catch (e: any) {
      if (e.message !== "Failed to fetch") {
        console.error(e);
      }
      alert("Failed to auto-translate. Please enter manually.");
    }`);

fs.writeFileSync(file, content);
