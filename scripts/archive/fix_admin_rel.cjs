const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

const regex = /  };\n          \n          await setDoc\(newRef, newFields\);\n          migrated\+\+;\n       \}\n       alert\(`Migration complete\. Migrated \$\{migrated\} relationships\.`\);\n     \} catch \(e\) \{\n       console\.error\("Migration error:", e\);\n       alert\("Migration failed\."\);\n     \}\n  \};\n/s;
const replacement = `  };\n`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
