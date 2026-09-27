const fs = require('fs');
const file = 'src/components/admin/UserManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/catch \(err: any\) \{\n      if \(\!\(err\?\.code === 'resource-exhausted' \|\| err\?\.message\?\.toLowerCase\(\)\.includes\('quota'\)\)\) console\.error\(err\);\n      setError\(err\.message\);\n    \}/g, `catch (err: any) {
      if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota') || err?.message === 'Failed to fetch')) console.error(err);
      setError(err.message);
    }`);

fs.writeFileSync(file, content);
