const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const migrationEndpoint = `  app.post("/api/migrate-product-recommendations", async (req, res) => {
    try {
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
      const data = await verifyRes.json();
      const uid = data.users[0].localId;
      
      if (!adminDb) {
         return res.status(500).json({ error: "Admin DB not initialized" });
      }
      
      // Verify Role
      const userDoc = await adminDb.collection("users").doc(uid).get();
      if (!userDoc.exists) {
         return res.status(403).json({ error: "User not found" });
      }
      const role = userDoc.data().role;
      if (role !== 'admin' && role !== 'superadmin' && role !== 'manager') {
         return res.status(403).json({ error: "Forbidden: insufficient role" });
      }
      
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
             const newId = \`\${sourceId}_\${targetId}\`;
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

  app.post("/api/process-product"`;

code = code.replace(/  app\.post\("\/api\/process-product"/, migrationEndpoint);
fs.writeFileSync('server.ts', code);
