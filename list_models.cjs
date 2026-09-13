const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");
const fs = require('fs');
dotenv.config();
async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.list();
  const arr = response.models || response;
  // If it's iterable, convert it, else use it
  let models = [];
  if (arr.length) { models = arr; }
  else if (arr.models) { models = arr.models; }
  else {
    for (let k of Object.keys(response)) {
      if (Array.isArray(response[k])) { models = response[k]; break; }
    }
  }
  
  const names = models.map(m => m.name).join('\n');
  fs.writeFileSync('models.txt', names);
}
run();
