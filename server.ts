import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY environment variable is required");
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

const PRODUCTS = [
  { id: '1', name: 'Aashirvaad Atta (5kg)', price: 210, category: 'Grocery', image: '🌾' },
  { id: '2', name: 'Tata Salt (1kg)', price: 25, category: 'Grocery', image: '🧂' },
  { id: '3', name: 'Toor Dal (1kg)', price: 160, category: 'Grocery', image: '🥣' },
  { id: '4', name: 'Maggi Noodles (140g)', price: 30, category: 'Grocery', image: '🍜' },
  { id: '5', name: 'Paracetamol Strip', price: 15, category: 'Medicine', image: '💊' },
  { id: '6', name: 'LED Bulb 9W', price: 100, category: 'Hardware', image: '💡' },
  { id: '7', name: 'Notebook 200 Pages', price: 45, category: 'Stationery', image: '📓' },
  { id: '8', name: 'Amul Milk (1L)', price: 64, category: 'Grocery', image: '🥛' },
  { id: '9', name: 'Sugar (1kg)', price: 42, category: 'Grocery', image: '🍬' },
  { id: '10', name: 'Tea Leaves (250g)', price: 120, category: 'Grocery', image: '☕' },
  { id: '11', name: 'Onion (1kg)', price: 40, category: 'Grocery', image: '🧅' },
  { id: '12', name: 'Potato (1kg)', price: 30, category: 'Grocery', image: '🥔' },
];

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json({ limit: '10mb' }));

  app.get("/api/products", (req, res) => {
    res.json(PRODUCTS);
  });

  app.post("/api/search", async (req, res) => {
    try {
      const { query, products } = req.body;
      if (!query || !products) {
        return res.status(400).json({ error: "Missing query or products" });
      }

      // Strip large fields like images to heavily reduce token usage and prevent 429 Resource Exhausted errors
      const minimalProducts = products.map((p: any) => ({
        id: p.id,
        name: p.name,
        nameHi: p.nameHi,
        category: p.category
      }));

      const ai = getAiClient();
      const prompt = `You are an AI search assistant for a grocery store app.
Given the following products:
${JSON.stringify(minimalProducts)}

The user searched for: "${query}".
Identify spelling variations, similar words, Hindi/English variations, and intended product terms to find the best semantic matches.
Return ONLY a JSON object with two fields:
- "ids": an array of matching product IDs (e.g. ["1", "3"])
- "terms": an array of related keywords or spelling variations (e.g. ["atta", "wheat", "flour"])

Return an empty array for ids if none match. Do NOT wrap it in markdown block quotes.`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });
      } catch (firstErr: any) {
        const errMsg = String(firstErr);
        if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("404")) {
          console.warn("Retrying with gemini-3.8-flash as fallback...");
          response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            }
          });
        } else {
          throw firstErr;
        }
      }

      let text = response.text || "{}";
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      try {
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          } else {
            throw e;
          }
        }
        const ids = Array.isArray(parsed) ? parsed : (parsed.ids || []);
        const terms = parsed.terms || [];
        res.json({ ids, terms });
      } catch (parseError) {
        console.error("AI returned invalid JSON:", text);
        res.status(500).json({ error: "Invalid JSON from AI" });
      }
    } catch (error) {
      console.error("AI Search API Error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/analyze-catalog", async (req, res) => {
    try {
      const { products, categories } = req.body;
      if (!products) {
        return res.status(400).json({ error: "Missing products" });
      }

      // Strip large fields
      const minimalProducts = products.map((p: any) => ({
        id: p.id,
        name: p.name,
        nameHi: p.nameHi,
        category: p.category
      }));
      
      const minimalCategories = categories ? categories.map((c: any) => ({
        id: c.id,
        name: c.nameEn,
        nameHi: c.nameHi,
        description: c.description
      })) : [];

      const ai = getAiClient();
      const prompt = `You are an AI for a grocery store app.
Given the following products:
${JSON.stringify(minimalProducts)}

And the following categories:
${JSON.stringify(minimalCategories)}

Analyze the COMPLETE current product and category catalog.
For every product, independently decide which other available products should be shown immediately after it to create an ORDERED "what should appear next" list.
The recommendations must be based on complementary shopping needs, products commonly useful together, cross-category shopping relationships, natural shopping journeys, and the actual available catalog.
Do NOT create simple product groups.
Do NOT make every product in a group point to every other product.
Do NOT require relationships to be bidirectional.
Do NOT assume similar products are automatically useful together.
Do NOT hard-code product relationships.
Do NOT limit the number of meaningful recommendations.
The returned array order is critical: position 1 = best product to show next, position 2 = second best, and so on.
Each recommendation must use an existing product ID from the current catalog.
A product can recommend products from completely different categories when you determine they are useful together.
The saved relations must represent: "WHEN THIS PRODUCT IS SHOWN, THESE PRODUCTS SHOULD BE SHOWN NEXT IN THIS ORDER."
Return ONLY a JSON object where the keys are product IDs, and the values are arrays of ordered related product IDs.
Do NOT wrap it in markdown block quotes.`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
      } catch (firstErr: any) {
        const errMsg = String(firstErr);
        if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("404")) {
          console.warn("Retrying with fallback...");
          response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
        } else {
          throw firstErr;
        }
      }

      let text = response.text || "{}";
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      // To handle cases where there's trailing garbage after the JSON object
      try {
        res.json(JSON.parse(text));
      } catch (parseError) {
        // Fallback: try to extract the JSON object using regex
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          res.json(JSON.parse(match[0]));
        } else {
          throw parseError;
        }
      }
    } catch (error) {
      console.error("AI Catalog Analysis Error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
