const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Replace gemini-3.1-pro-preview with gemini-2.5-flash
code = code.replaceAll('gemini-3.1-pro-preview', 'gemini-2.5-flash');

// We should also sleep in the catch block if we are retrying.
// The easiest way is to just replace the models, since Gemini API Node SDK will probably just work if we retry with flash. 
// But let's actually inject a sleep helper.
code = code.replace(
  'import { GoogleGenAI } from "@google/genai";',
  'import { GoogleGenAI } from "@google/genai";\nconst sleep = (ms: number) => new Promise(r => setTimeout(r, ms));'
);

code = code.replaceAll(
  'console.warn("Retrying with fallback...");',
  'console.warn("Retrying with fallback...");\n          await sleep(2000);'
);

code = code.replaceAll(
  'console.warn("Translation retry with gemini-2.5-flash...");',
  'console.warn("Translation retry with gemini-2.5-flash...");\n        await sleep(2000);'
);

code = code.replaceAll(
  'console.warn("Retrying with gemini-2.5-flash as fallback...");',
  'console.warn("Retrying with gemini-2.5-flash as fallback...");\n          await sleep(2000);'
);

// We should also catch 429 and retry.
code = code.replaceAll(
  'if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("404"))',
  'if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("404") || errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED"))'
);


fs.writeFileSync('server.ts', code);
console.log("Updated rate limits and retries");
