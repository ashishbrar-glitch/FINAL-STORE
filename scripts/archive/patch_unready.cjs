const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');
code = code.replace(
  'Generate Missing ({Object.values(products).filter(p => p.searchStatus !== "ready" && p.searchStatus !== "processing").length})',
  'Generate Missing ({unreadyCount})'
);
fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
