const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

code = code.replace(
  '                             if (relDoc.exists()) {\n                                const f = relDoc.data();\n                                if (f.status === "approved" || f.status === "blocked") continue;\n                                isExisting = true;\n                             }',
  '                             if (relDoc.exists()) {\n                                continue;\n                             }'
);

fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
