import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let ai;
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

  app.use(express.json());

  // API routes FIRST
  app.post("/api/search", async (req, res) => {
    try {
      const { query, products } = req.body;
      if (!query || !products) {
        return res.json({ productIds: [] });
      }

      const prompt = `Match the user query "${query}" to the following products. Handle typos, regional languages (like Hindi/English translation), and semantic intent (e.g. "sweet" -> sugar, "head ache" -> paracetamol, "chai" -> tea). Products: ${JSON.stringify(products.map(p => ({id: p.id, name: p.name, category: p.category})))}
Return ONLY a JSON array of matching product IDs. Example: ["1", "5"]`;

      const response = await getAiClient().models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            }
          },
          temperature: 0,
        }
      });

      const matchedIds = JSON.parse(response.text);
      res.json({ productIds: matchedIds });
    } catch (error) {
      console.error("Search API Error:", error);
      res.status(500).json({ error: "Search failed", productIds: [] });
    }
  });
  
  app.get("/api/products", (req, res) => {
    res.json(PRODUCTS);
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
