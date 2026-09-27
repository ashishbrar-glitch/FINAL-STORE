const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/RecommendationRel/g, 'ProductRecommendation');
fs.writeFileSync('src/App.tsx', code);
