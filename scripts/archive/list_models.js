const { GoogleGenAI } = require("@google/genai");
async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.list();
  for await (const page of response) {
    for (const model of page) {
      if (model.name.includes("flash") || model.name.includes("pro")) {
        console.log(model.name, "-", model.displayName);
      }
    }
  }
}
run();
