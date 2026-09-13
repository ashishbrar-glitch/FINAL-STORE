const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `const safeId = lowerQuery.replace(/[^a-z0-9]/gi, '_');`;
const replacementStr = `const safeId = "q_" + encodeURIComponent(lowerQuery).replace(/\\./g, '%2E');`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched successfully");
} else {
  console.log("Target string not found.");
}
