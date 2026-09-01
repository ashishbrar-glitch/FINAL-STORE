const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldInit = `const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});`;

const newInit = `let ai;
function getAiClient() {
  if (!ai) {
    ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || 'dummy_key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}`;

if (code.includes(oldInit)) {
  code = code.replace(oldInit, newInit);
  code = code.replace('await ai.models.generateContent', 'await getAiClient().models.generateContent');
  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts");
} else {
  console.log("Could not find old init");
}
