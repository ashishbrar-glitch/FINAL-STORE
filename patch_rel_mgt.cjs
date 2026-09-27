const fs = require('fs');
const file = 'src/components/admin/RelationshipManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/catch \(e\) \{\n      console\.error\(e\);\n    \}/g, `catch (e: any) {
      if (e.message !== "Failed to fetch") {
        console.error(e);
      }
    }`);

fs.writeFileSync(file, content);
