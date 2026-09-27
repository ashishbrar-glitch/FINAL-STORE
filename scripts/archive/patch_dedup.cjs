const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const dedupRegex = /const seenTargetIds = new Set<string>\(\);\s*snap\.forEach\(docSnap => \{[\s\S]*?\}\);/s;

const dedupReplacement = `const bestCandidates = new Map<string, { product: Product, rel: ProductRecommendation }>();
       
       snap.forEach(docSnap => {
          const rel = docSnap.data() as ProductRecommendation;
          
          const p = products.find(prod => prod.id === rel.targetProductId);
          if (p && p.isActive && p.isAvailable) {
             const currentScore = scoreRecommendation(p, sourceProduct, rel);
             const existing = bestCandidates.get(rel.targetProductId);
             if (!existing || currentScore > scoreRecommendation(existing.product, sourceProduct, existing.rel)) {
                bestCandidates.set(rel.targetProductId, { product: p, rel });
             }
          }
       });
       
       const results = Array.from(bestCandidates.values());`;

code = code.replace(dedupRegex, dedupReplacement);
fs.writeFileSync('src/App.tsx', code);
