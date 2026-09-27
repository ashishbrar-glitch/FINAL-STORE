const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldPoolRegex = /\/\/ Step 2: Relationships candidate pool[\s\S]*?const minimalPool = pool\.map\(\(p: any\) => \(\{ id: p\.id, name: p\.name, category: p\.category \}\)\);/s;

const newPoolCode = `// Step 2: Relationships candidate pool
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
      const minimalPool = candidatePool.map((p: any) => ({ id: p.id, name: p.name, category: p.category }));`;

code = code.replace(oldPoolRegex, newPoolCode);
fs.writeFileSync('server.ts', code);
