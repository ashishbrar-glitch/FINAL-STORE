const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf-8');

const newEndpoint = `
  app.post("/api/generate-aliases-batch", async (req, res) => {
    try {
      const { products } = req.body;
      if (!products || !Array.isArray(products)) {
        return res.status(400).json({ error: "Missing or invalid products array" });
      }

      const ai = getAiClient();
      const prompt = \`You are an AI assistant for a local village grocery store in India.
Your task is to generate realistic search aliases for a batch of products to improve search.
These aliases must include:
- Common spelling variations and typos.
- Local/village/regional names (including informal Hindi/local vocabulary, e.g., "makhan" for butter/ghee, "doodh" for milk, "shakar" for sugar).
- Phonetic English transliterations (e.g. typing "gheee", "gehe", "biscuit").
- Related everyday terms villagers might use.

Input Products:
\${JSON.stringify(products.map((p: any) => ({
  id: p.id,
  name: p.name,
  nameHi: p.nameHi,
  nameEn: p.nameEn,
  category: p.category
})))}

Return ONLY a JSON object where the keys are the product IDs, and the values are arrays of string aliases.
Do NOT wrap the result in markdown block quotes (no \`\`\`json). Just the raw JSON object.\`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
      } catch (firstErr: any) {
        console.warn("Retrying generate-aliases-batch with fallback...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
      }

      let text = response.text || "{}";
      text = text.replace(/^\\s*\`\`\`(?:json)?\\s*/i, '').replace(/\\s*\`\`\`\\s*$/i, '').trim();

      try {
        const parsed = JSON.parse(text);
        res.json(parsed);
      } catch (parseError) {
        const match = text.match(/\\{[\\s\\S]*\\}/);
        if (match) {
          res.json(JSON.parse(match[0]));
        } else {
          throw parseError;
        }
      }
    } catch (error) {
      console.error("AI Alias Generation Error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

`;

serverCode = serverCode.replace('app.post("/api/analyze-catalog"', newEndpoint + 'app.post("/api/analyze-catalog"');
fs.writeFileSync('server.ts', serverCode);
