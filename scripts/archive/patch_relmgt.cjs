const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

const regex = /\s*const slimCatalog = \(Object\.values\(products\) as any\[\]\)\.map\(pr => \(\{ id: pr\.id, name: pr\.name, category: pr\.category, isActive: pr\.isActive, isAvailable: pr\.isAvailable \}\)\);\n/s;
code = code.replace(regex, '');

fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
