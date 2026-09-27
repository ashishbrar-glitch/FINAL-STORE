const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

code = code.replace(
  'const result = await res.json();',
  'const result = await res.json();\n                       console.log("AI Result:", result);'
);

code = code.replace(
  '                    } catch (e) {',
  '                    } catch (e) {\n                       console.error("Generate error:", e);'
);

fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
