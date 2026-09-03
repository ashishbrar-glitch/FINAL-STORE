import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
dotenv.config();

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
