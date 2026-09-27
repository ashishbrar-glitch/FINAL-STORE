const fs = require('fs');
let content = fs.readFileSync('src/components/admin/CategoryManagement.tsx', 'utf8');
content = content.replace(/catch \(e\) \{\n      console\.error\(e\);\n      alert/g, `catch (e: any) {
      if (e.message !== "Failed to fetch" && !e.message?.includes("Unexpected token '<'")) console.error(e);
      alert`);
fs.writeFileSync('src/components/admin/CategoryManagement.tsx', content);
