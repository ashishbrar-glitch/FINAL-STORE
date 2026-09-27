const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

code = code.replace(/collection\(db, "productRelationships"\)/g, 'collection(db, "productRecommendations")');

const oldManualAdd = /const sortedIds = \[newRel\.p1, newRel\.p2\]\.sort\(\);\n    const relId = sortedIds\.join\('_'\);\n    try \{\n      await setDoc\(doc\(db, "productRelationships", relId\), \{\n         participants: sortedIds,\n         type: newRel\.type,\n         confidence: 1\.0,\n         source: "manual",\n         status: "approved",\n         createdAt: Date\.now\(\),\n         updatedAt: Date\.now\(\)\n      \}\);/s;

const newManualAdd = `const sourceId = newRel.p1;
    const targetId = newRel.p2;
    const relId = \`\${sourceId}_\${targetId}\`;
    try {
      await setDoc(doc(db, "productRecommendations", relId), {
         sourceProductId: sourceId,
         targetProductId: targetId,
         type: newRel.type,
         placement: newRel.type === 'complementary' ? 'goes_well_with' : 'similar_products',
         confidence: 1.0,
         priority: newRel.type === 'complementary' ? 80 : 50,
         categoryFit: 1.0,
         priceFit: 1.0,
         bestsellerBoost: 0,
         source: "manual",
         status: "approved",
         createdAt: Date.now(),
         updatedAt: Date.now()
      });`;

code = code.replace(oldManualAdd, newManualAdd);

code = code.replace(/doc\(db, "productRelationships", id\)/g, 'doc(db, "productRecommendations", id)');

const oldMigration = /const runMigration = async \(\) => \{.*?^\s*};\n/sm;

const newMigration = `const runMigration = async () => {
     if (!confirm("Are you sure you want to migrate old productRelationships to productRecommendations? This is safe to run multiple times.")) return;
     try {
       const oldSnap = await getDocs(collection(db, 'productRelationships'));
       let migrated = 0;
       
       const createRel = async (sourceId, targetId, data) => {
          const newId = \`\${sourceId}_\${targetId}\`;
          const newRef = doc(db, 'productRecommendations', newId);
          const existing = await getDoc(newRef);
          if (existing.exists()) return false;
          
          const newFields = {
            sourceProductId: sourceId,
            targetProductId: targetId,
            type: data.type || 'similar',
            placement: data.type === 'complementary' ? 'goes_well_with' : 'similar_products',
            confidence: data.confidence || 0.8,
            priority: data.type === 'complementary' ? 80 : 50,
            categoryFit: 0.8,
            priceFit: 0.8,
            bestsellerBoost: 0,
            status: data.status || 'pending',
            source: data.source || 'ai',
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now()
          };
          await setDoc(newRef, newFields);
          return true;
       };
       
       for (const docSnap of oldSnap.docs) {
          const data = docSnap.data();
          if (!data.participants || data.participants.length !== 2) continue;
          
          const [A, B] = data.participants;
          // The old system was undirected. Translate to explicit directed relationships.
          if (await createRel(A, B, data)) migrated++;
          if (await createRel(B, A, data)) migrated++;
       }
       alert(\`Migration complete. Created \${migrated} directional recommendations.\`);
     } catch (e) {
       console.error("Migration error:", e);
       alert("Migration failed.");
     }
  };
`;

code = code.replace(oldMigration, newMigration);

// Restore the one place migration needs to read productRelationships!
code = code.replace(/const oldSnap = await getDocs\(collection\(db, 'productRecommendations'\)\);/, `const oldSnap = await getDocs(collection(db, 'productRelationships'));`);

fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
