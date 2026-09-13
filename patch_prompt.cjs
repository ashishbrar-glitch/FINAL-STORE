const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const targetStr = 'Identify spelling variations, similar words, Hindi/English variations, and intended product terms to find the best semantic matches.';
const replacementStr = `IMPORTANT INSTRUCTION: The 'name' field is often in a local language. The 'nameEn' field contains the proper English name and AI search keywords.
If the user's query is in English, you MUST aggressively prioritize matching the query against the 'nameEn' and 'category' fields to find the perfect matches. 
Identify spelling variations, similar words, Hindi/English variations, and intended product terms to find the best semantic matches.`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('server.ts', code);
