const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');
code = code.replace(
  '              auth.currentUser?.getIdToken().then(token => {',
  '              auth.currentUser?.getIdToken().then(async token => {'
);
fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
