const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

const migrationLogic = `
  const runMigration = async () => {
     if (!confirm("Are you sure you want to migrate old productRelationships to productRecommendations? This is safe to run multiple times.")) return;
     try {
       const oldSnap = await getDocs(collection(db, 'productRelationships'));
       let migrated = 0;
       
       for (const docSnap of oldSnap.docs) {
          const data = docSnap.data();
          if (!data.participants || data.participants.length !== 2) continue;
          
          const [A, B] = data.participants;
          const newId = \`\${A}_\${B}\`;
          const newRef = doc(db, 'productRecommendations', newId);
          
          const existing = await getDoc(newRef);
          if (existing.exists()) continue;
          
          const newFields = {
            sourceProductId: A,
            targetProductId: B,
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
          migrated++;
       }
       alert(\`Migration complete. Migrated \${migrated} relationships.\`);
     } catch (e) {
       console.error("Migration error:", e);
       alert("Migration failed.");
     }
  };
`;

code = code.replace(/const recoverStuckItems = async \(\) => \{/, migrationLogic + '\n      const recoverStuckItems = async () => {');

const migrationButton = `        <button
          onClick={runMigration}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Migrate Old Data
        </button>
        <button
          onClick={() => setShowAddForm(!showAddForm)}`;

code = code.replace(/<button\s+onClick=\{\(\) => setShowAddForm\(\!showAddForm\)\}/s, migrationButton);

fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
