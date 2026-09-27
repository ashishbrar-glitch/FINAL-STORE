const fs = require('fs');
let content = fs.readFileSync('server/aiWorker.ts', 'utf8');

content = content.replace(
  /if \(code === 'CONTENT_POLICY' \|\| \(code === 'TOKEN_LIMIT' && attempts >= 2\) \|\| attempts >= job\.maxAttempts\) \{/,
  `if (code === 'CONTENT_POLICY' || attempts >= job.maxAttempts) {`
);

fs.writeFileSync('server/aiWorker.ts', content);
