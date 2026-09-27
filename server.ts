import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getFirestore, runTransaction, doc, getDocs, collection } from "firebase/firestore";
import { initializeApp as initAdminApp, applicationDefault } from "firebase-admin/app";
import { getFirestore as getAdminFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import fs from "fs";
import { initAIWorker } from "./server/aiWorker.ts";

dotenv.config();
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY environment variable is required");
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}


// Initialize Firebase for server
let db: any = null;
let firebaseConfig: any = null;
let adminDb = null;
let adminAuth: any = null;
try {
  firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp);
  
  const adminApp = initAdminApp({
    credential: applicationDefault(),
    projectId: firebaseConfig.projectId
  });
  adminDb = getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId || '(default)');
  adminAuth = getAdminAuth(adminApp);
} catch (e) {
  console.error("Failed to initialize Firebase on server:", e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

async function verifyAdminAuth(req, res, requiredRoles = ['manager', 'admin', 'superadmin']) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      res.status(403).json({ error: "Forbidden: user doc not found" });
      return null;
    }
    const role = userDoc.data().role;
    if (!requiredRoles.includes(role)) {
      res.status(403).json({ error: "Forbidden: insufficient role" });
      return null;
    }
    return { uid, role };
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
}



  app.delete("/api/admin/users/:uid", async (req, res) => {
    const authData = await verifyAdminAuth(req, res, ['admin', 'superadmin']);
    if (!authData) return;
    
    try {
      const targetUid = req.params.uid;
      
      const targetDoc = await adminDb.collection("users").doc(targetUid).get();
      if (targetDoc.exists) {
         const targetRole = targetDoc.data().role;
         if (targetRole === 'superadmin' && authData.role !== 'superadmin') {
            return res.status(403).json({ error: "Only superadmin can delete a superadmin" });
         }
      }
      
      try {
        await adminAuth.deleteUser(targetUid);
      } catch (e) {
        if (e.code !== 'auth/user-not-found') throw e;
      }
      
      await adminDb.collection("users").doc(targetUid).delete();
      
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/users", async (req, res) => {
    const authData = await verifyAdminAuth(req, res, ['admin', 'superadmin']);
    if (!authData) return;
    
    try {
      const { email, password, role } = req.body;
      if (!email || !password || !role) {
         return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Strict role hierarchy
      if (role === 'superadmin' && authData.role !== 'superadmin') {
         return res.status(403).json({ error: "Only superadmin can create another superadmin" });
      }
      if (role === 'admin' && authData.role !== 'superadmin') {
         return res.status(403).json({ error: "Only superadmin can create another admin" });
      }
      
      const userRecord = await adminAuth.createUser({
         email,
         password,
      });
      
      await adminDb.collection("users").doc(userRecord.uid).set({
         uid: userRecord.uid,
         email: email,
         role: role,
         createdAt: Date.now()
      });
      
      res.json({ success: true, uid: userRecord.uid });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/translate-admin", async (req, res) => {
    const authData = await verifyAdminAuth(req, res);
    if (!authData) return;

    try {
      const { text, type } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text" });
      }

      const ai = getAiClient();
      let prompt = "";
      
      if (type === "category") {
        prompt = `Translate the following English category name to Hindi, and provide a single relevant emoji.
        Category: "${text}"
        Return ONLY valid JSON matching this schema: { "nameHi": "Hindi name here", "emoji": "🍎" }`;
      } else {
        prompt = `Translate the following English product name to Hindi.
        Product: "${text}"
        Return ONLY valid JSON matching this schema: { "nameHi": "Hindi name here" }`;
      }

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
      } catch (err: any) {
        console.warn("Translation retry...");
        await sleep(2000);
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
      }

      let responseText = response.text || "{}";
      const json = JSON.parse(responseText);
      res.json(json);
    } catch (error) {
      console.error("Translate API Error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // NEW ENRICHMENT PIPELINE
  app.post("/api/migrate-product-recommendations", async (req, res) => {
    try {
      const authData = await verifyAdminAuth(req, res);
      if (!authData) return;
      
      // Migration Logic
      const oldSnap = await adminDb.collection('productRelationships').get();
      let scanned = 0;
      let created = 0;
      let skippedExisting = 0;
      let skippedInvalid = 0;
      
      for (const docSnap of oldSnap.docs) {
          scanned++;
          const data = docSnap.data();
          if (!data.participants || data.participants.length !== 2) {
             skippedInvalid++;
             continue;
          }
          
          const [A, B] = data.participants;
          
          const createRel = async (sourceId, targetId, legacyData) => {
             const newId = `${sourceId}_${targetId}`;
             const newRef = adminDb.collection('productRecommendations').doc(newId);
             const existing = await newRef.get();
             if (existing.exists) {
                 return false; // Skip
             }
             
             const newFields = {
                sourceProductId: sourceId,
                targetProductId: targetId,
                type: legacyData.type || 'similar',
                placement: legacyData.type === 'complementary' ? 'goes_well_with' : 'similar_products',
                confidence: legacyData.confidence || 0.8,
                priority: legacyData.type === 'complementary' ? 80 : 50,
                categoryFit: 0.8,
                priceFit: 0.8,
                bestsellerBoost: 0,
                status: legacyData.status || 'pending',
                source: legacyData.source || 'ai',
                createdAt: legacyData.createdAt || Date.now(),
                updatedAt: legacyData.updatedAt || Date.now()
             };
             await newRef.set(newFields);
             return true;
          };
          
          if (await createRel(A, B, data)) { created++; } else { skippedExisting++; }
          if (await createRel(B, A, data)) { created++; } else { skippedExisting++; }
      }
      
      res.json({
        success: true,
        scanned,
        created,
        skippedExisting,
        skippedInvalid
      });
      
    } catch (e: any) {
      console.error("Migration error:", e);
      res.status(500).json({ error: e.message });
    }
  });
  initAIWorker(adminDb, adminAuth, getAiClient, app);
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