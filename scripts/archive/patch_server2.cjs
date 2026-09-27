const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\s*const relSnap = await getDocs\(collection\(db, "productRecommendations"\)\);\n\s*res\.json\(\{ products: statuses, relationships: relSnap\.size \}\);\n\s*\} catch \(e\) \{ res\.status\(500\)\.json\(\{ error: e\.message \}\); \}\n\s*\}\);\n/s;
code = code.replace(regex, '');

fs.writeFileSync('server.ts', code);
