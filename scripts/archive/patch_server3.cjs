const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/collection\(db, "productRelationships"\)/, 'collection(db, "productRecommendations")');

fs.writeFileSync('server.ts', code);
