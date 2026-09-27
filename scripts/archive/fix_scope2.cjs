const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

code = code.replace(
  "const processingProducts = Object.values(products).filter(p => p.searchStatus === 'processing');\\n      // Detect stuck products",
  "const processingProducts = Object.values(products).filter(p => p.searchStatus === 'processing');\n      // Detect stuck products"
);

fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
