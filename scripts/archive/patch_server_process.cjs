const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\("\/api\/process-product", async \(req, res\) => \{[\s\S]*?console\.log\("Successfully processed:", productData\.name, "Found Rels:", validatedRelationships\.length\);[\s\S]*?\} catch \(error: any\) \{/s;

const replacement = `app.post("/api/process-product", async (req, res) => {
    try {
      const authData = await verifyAdminAuth(req, res);
      if (!authData) return;

      const { productId } = req.body;
      if (!productId) {
         return res.status(400).json({ error: "Missing productId" });
      }
      
      const productRef = adminDb.collection("products").doc(productId);
      const productSnap = await productRef.get();
      if (!productSnap.exists) {
         return res.status(404).json({ error: "Product not found" });
      }
      const productData = { id: productSnap.id, ...productSnap.data() };
      
      const catalogSnap = await adminDb.collection("products").get();
      const catalog = catalogSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const ai = getAiClient();
      
      // Step 1: Aliases
      const aliasPrompt = \`Generate realistic search aliases for this grocery product in India to improve fuzzy search.\\nInclude common misspellings, local village names (Hinglish/Hindi vocabulary like "makhan" for ghee, "shakar" for sugar), and phonetic transliterations.\\nProduct: \${productData.name} (English: \${productData.nameEn || ''}, Hindi: \${productData.nameHi || ''}, Category: \${productData.category})\\nReturn ONLY a JSON object: { "aliases": ["alias1", "alias2"] }\`;
      
      const aliasRes = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: aliasPrompt,
        config: { responseMimeType: "application/json" }
      });
      
      let aiAliases = JSON.parse(aliasRes.text || '{"aliases":[]}').aliases || [];
      aiAliases = aiAliases.slice(0, 15).map((a: string) => String(a).toLowerCase().trim());
      
      // Step 2: Relationships candidate pool
      const validCatalog = catalog.filter((p: any) => 
        p.id !== productData.id && 
        p.isActive !== false && 
        p.isAvailable !== false
      );
      
      // Rank catalog items deterministically for candidate pool
      validCatalog.sort((a: any, b: any) => {
         let scoreA = 0;
         let scoreB = 0;
         
         if (a.subcategory && a.subcategory === productData.subcategory) scoreA += 100;
         if (b.subcategory && b.subcategory === productData.subcategory) scoreB += 100;
         
         if (a.brand && a.brand === productData.brand) scoreA += 50;
         if (b.brand && b.brand === productData.brand) scoreB += 50;
         
         if (a.category === productData.category) scoreA += 10;
         if (b.category === productData.category) scoreB += 10;
         
         if (scoreA !== scoreB) return scoreB - scoreA;
         // Deterministic tie breaker by ID
         return a.id.localeCompare(b.id);
      });
      
      const candidatePool = validCatalog.slice(0, 30);
      const minimalPool = candidatePool.map((p: any) => ({ id: p.id, name: p.name, category: p.category }));

      // Step 3: Relationships
      let validatedRelationships: any[] = [];
      if (minimalPool.length > 0) {
        const relPrompt = \`You are an AI for a grocery store. Suggest products that are complementary or similar to the target product.
Target Product: \${productData.name} (\${productData.category})
Candidate Pool (only these IDs are valid): \${JSON.stringify(minimalPool)}
Return ONLY a JSON object: { "recommendations": [{ "targetId": "string", "type": "similar" | "complementary", "confidence": 0.92, "priority": 90, "categoryFit": 0.85, "priceFit": 0.80, "bestsellerBoost": 0.10, "placement": "goes_well_with" | "similar_products" }] }\`;

        const relRes = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: relPrompt,
          config: { responseMimeType: "application/json" }
        });
        
        const recommendations = JSON.parse(relRes.text || '{"recommendations":[]}').recommendations || [];
        const poolMap = new Map(candidatePool.map((p: any) => [p.id, p]));
        
        for (const rel of recommendations) {
          const target = poolMap.get(rel.targetId) as any;
          if (!target) continue;
          if (target.id === productData.id) continue;
          if (target.isActive === false || target.isAvailable === false) continue;
          
          if (rel.type !== "similar" && rel.type !== "complementary") continue;
          if (rel.placement !== "goes_well_with" && rel.placement !== "similar_products") continue;
          
          const conf = Math.max(0, Math.min(1, Number(rel.confidence) || 0));
          const catFit = Math.max(0, Math.min(1, Number(rel.categoryFit) || 0));
          const priceFit = Math.max(0, Math.min(1, Number(rel.priceFit) || 0));
          const bsBoost = Math.max(0, Math.min(1, Number(rel.bestsellerBoost) || 0));
          const prio = Math.max(0, Math.min(100, Number(rel.priority) || 0));
          
          validatedRelationships.push({
            targetId: rel.targetId,
            type: rel.type,
            placement: rel.placement,
            confidence: conf,
            priority: prio,
            categoryFit: catFit,
            priceFit: priceFit,
            bestsellerBoost: bsBoost
          });
        }
        validatedRelationships = validatedRelationships.slice(0, 10);
      }
      
      const now = Date.now();
      
      // Update product status
      await productRef.update({
         searchStatus: 'ready',
         aiSearchAliases: aiAliases,
         lastProcessedAt: now
      });
      
      // Write to productRecommendations using Admin SDK
      let savedCount = 0;
      for (const rel of validatedRelationships) {
          const relId = \`\${productData.id}_\${rel.targetId}\`;
          const relRef = adminDb.collection("productRecommendations").doc(relId);
          const relDoc = await relRef.get();
          if (relDoc.exists) continue;
          
          await relRef.set({
             sourceProductId: productData.id,
             targetProductId: rel.targetId,
             type: rel.type,
             placement: rel.placement,
             confidence: rel.confidence,
             priority: rel.priority,
             categoryFit: rel.categoryFit,
             priceFit: rel.priceFit,
             bestsellerBoost: rel.bestsellerBoost,
             source: "ai",
             status: "pending",
             updatedAt: now,
             createdAt: now
          });
          savedCount++;
      }
      
      console.log("Successfully processed:", productData.name, "Found Rels:", validatedRelationships.length, "Saved Rels:", savedCount);
      res.json({ status: "success", aliases: aiAliases, savedCount });
      
    } catch (error: any) {`;

code = code.replace(regex, replacement);

fs.writeFileSync('server.ts', code);
