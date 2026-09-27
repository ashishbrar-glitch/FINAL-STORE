const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

// Remove from old location
const oldStuckLogic = `      // Detect stuck products
      const stuckProducts = processingProducts.filter(p => !p.processingStartedAt || (Date.now() - p.processingStartedAt) > 3 * 60 * 1000);
      
      const recoverStuckItems = async () => {
         if (stuckProducts.length === 0) return;
         if (!confirm(\`Reset \${stuckProducts.length} stuck items?\`)) return;
         
         for (const p of stuckProducts) {
             try {
                await updateDoc(doc(db, "products", p.id), { searchStatus: "none", processingStartedAt: null });
             } catch (e) {}
         }
      };
      
      const unreadyCount = Object.values(products).filter(p => p.searchStatus !== "ready" && p.searchStatus !== "processing").length;
`;

code = code.replace(oldStuckLogic, '');

// Insert after processingProducts
const targetStr = `  const processingProducts = Object.values(products).filter(p => p.searchStatus === 'processing');`;
code = code.replace(targetStr, targetStr + '\\n' + oldStuckLogic.replace(/\\`/g, '`'));

fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
