const fs = require('fs');
let content = fs.readFileSync('server/aiWorker.ts', 'utf8');

content = content.replace(
  /const target = poolMap\.get\(rel\.targetId\);/,
  `const target = poolMap.get(rel.targetId) as any;`
);

fs.writeFileSync('server/aiWorker.ts', content);
