const fs = require('fs');
let code = fs.readFileSync('src/components/admin/UserManagement.tsx', 'utf8');

code = code.replace(/<span className="text-\[10px\] text-gray-400 font-mono">Pass: \{user\.password\}<\/span>/, '');

fs.writeFileSync('src/components/admin/UserManagement.tsx', code);
