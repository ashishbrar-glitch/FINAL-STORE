const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

code = code.replace(
  /const p1 = products\[r\.participants\?\.\[0\]\]\?\.name\?\.toLowerCase\(\) \|\| '';\n      const p2 = products\[r\.participants\?\.\[1\]\]\?\.name\?\.toLowerCase\(\) \|\| '';/,
  `const p1 = products[r.sourceProductId]?.name?.toLowerCase() || '';\n      const p2 = products[r.targetProductId]?.name?.toLowerCase() || '';`
);

fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
