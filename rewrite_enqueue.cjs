const fs = require('fs');
let content = fs.readFileSync('server/aiWorker.ts', 'utf8');

// Remove searchStatus logic from enqueue
content = content.replace(
  /\/\/ Search status migration logic dictates this should set searchStatus safely\s*if \(p\.searchStatus === 'ready' \|\| !p\.searchStatus\) \{\s*batch\.update\(pDoc\.ref, \{ searchStatus: 'pending' \}\);\s*\}/,
  `// Removed searchStatus update`
);

fs.writeFileSync('server/aiWorker.ts', content);
