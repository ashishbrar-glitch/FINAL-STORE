const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\("\/api\/process-product"[\s\S]*?res\.status\(500\)\.json\(\{ error: String\(error\) \}\);\n    \}\n  \}\);/g;

const replacement = `app.post("/api/process-product", async (req, res) => {
    try {
      if (!db) throw new Error("Database not initialized");
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return res.status(401).json({ error: "Unauthorized" });
      }
      const token = authHeader.split('Bearer ')[1];
      
      const verifyRes = await fetch(\`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=\${firebaseConfig.apiKey}\`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ idToken: token })
      });
      if (!verifyRes.ok) {
         return res.status(401).json({ error: "Invalid token" });
      }
      const verifyData = await verifyRes.json();
      const uid = verifyData.users[0].localId;
      
      const { doc, getDoc, collection, getDocs } = require('firebase/firestore');
      const userDoc = await getDoc(doc(db, 'users', uid));
      let role = null;
      if (userDoc.exists()) {
          role = userDoc.data().role;
      } else {
          return res.status(403).json({ error: "Forbidden: User not found in database" });
      }
      
      if (!['superadmin', 'admin', 'manager'].includes(role)) {
          return res.status(403).json({ error: "Forbidden: Insufficient role" });
      }

      const { productId } = req.body;
      if (!productId) return res.status(400).json({ error: "Missing productId" });
      
      const pDoc = await getDoc(doc(db, "products", productId));
      if (!pDoc.exists()) throw new Error("Product not found");
      const productData = pDoc.data();
      
      const snap = await getDocs(collection(db, "products"));
      const catalog = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const ai = getAiClient();
      
      // Step 2: Gemini Call 1 (Aliases)
      const aliasPrompt = \`Generate realistic search aliases for this grocery product in India to improve fuzzy search.
Include common misspellings, local village names (Hinglish/Hindi vocabulary like "makhan" for ghee, "shakar" for sugar), and phonetic transliterations.
Product: \${productData.name} (English: \${productData.nameEn || ''}, Hindi: \${productData.nameHi || ''}, Category: \${productData.category})
Return ONLY a JSON object: { "aliases": ["alias1", "alias2"] }\`;
      
      const aliasRes = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: aliasPrompt,
        config: { responseMimeType: "application/json" }
      });
      
      let aliasText = aliasRes.text || '{"aliases":[]}';
      let aiAliases = JSON.parse(aliasText).aliases || [];
      
      // Alias collision validation
      const { normalizeStr } = require('./src/lib/search/normalize.ts');
      const activeNormalizedNames = catalog
        .filter(p => p.id !== productId)
        .map(p => normalizeStr(p.name))
        .filter(n => n.length > 0);
      const nameSet = new Set(activeNormalizedNames);

      // Validate aliases
      aiAliases = [...new Set(aiAliases.map((a) => String(a).trim().toLowerCase()))]
        .filter((a) => {
           if (a.length === 0 || a.length > 40) return false;
           const norm = normalizeStr(a);
           // Reject if exactly matches another product's exact name
           if (nameSet.has(norm)) return false;
           return true;
        })
        .slice(0, 15);

      // Step 3: Deterministic Candidate Pool
      let candidatePool = [];
      const availableCatalog = catalog.filter(p => p.id !== productId && p.isActive !== false && p.isAvailable !== false);
      
      if (productData.category && productData.subcategory) {
          candidatePool.push(...availableCatalog.filter(p => p.category === productData.category && p.subcategory === productData.subcategory));
      }
      if (productData.category && productData.brand) {
          candidatePool.push(...availableCatalog.filter(p => p.category === productData.category && p.brand === productData.brand && !candidatePool.includes(p)));
      }
      if (productData.category) {
          candidatePool.push(...availableCatalog.filter(p => p.category === productData.category && !candidatePool.includes(p)));
      }
      
      const pool = candidatePool.slice(0, 30);
      
      const minimalPool = pool.map(p => ({ id: p.id, name: p.name, category: p.category }));

      // Step 4: Gemini Call 2 (Relationships)
      let validatedRelationships = [];
      
      if (minimalPool.length > 0) {
        const relPrompt = \`You are an AI for a grocery store. Suggest products that are complementary or similar to the target product.
Target Product: \${productData.name} (\${productData.category})
Candidate Pool: \${JSON.stringify(minimalPool)}
Return ONLY a JSON object: { "relationships": [{ "targetId": "string", "type": "similar" | "complementary", "confidence": 0.8 }] }\`;

        const relRes = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: relPrompt,
          config: { responseMimeType: "application/json" }
        });

        let relText = relRes.text || '{"relationships":[]}';
        const relationships = JSON.parse(relText).relationships || [];

        // Step 5: VALIDATION LAYER
        const poolIds = new Set(minimalPool.map(p => p.id));
        
        for (const rel of relationships) {
          if (
            poolIds.has(rel.targetId) &&
            (rel.type === "similar" || rel.type === "complementary") &&
            typeof rel.confidence === "number" &&
            rel.confidence >= 0.6
          ) {
            validatedRelationships.push(rel);
          }
        }
        validatedRelationships = validatedRelationships.slice(0, 8);
      }

      res.json({ aliases: aiAliases, relationships: validatedRelationships });

    } catch (error) {
      console.error("Process Product API Error:", error);
      res.status(500).json({ error: String(error) });
    }
  });`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
