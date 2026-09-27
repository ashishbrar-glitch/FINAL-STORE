const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

const oldCode = `                 unready.forEach(async p => {
                    try {
                       await updateDoc(doc(db, "products", p.id), { searchStatus: "processing" });
                       const res = await fetch("/api/process-product", {
                         method: "POST",
                         headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                         body: JSON.stringify({ productData: p, catalog: Object.values(products) })
                       });
                       const result = await res.json();
                       console.log("AI Result:", result);
                       if (result.status === "success") {
                          await updateDoc(doc(db, "products", p.id), { 
                             searchStatus: "ready", aiSearchAliases: result.aliases, lastProcessedAt: Date.now()
                          });
                          const now = Date.now();
                          for (const rel of result.relationships) {
                             const sortedIds = [p.id, rel.targetId].sort();
                             const relId = sortedIds.join('_');
                             const relRef = doc(db, "productRelationships", relId);
                             const relDoc = await getDoc(relRef);
                             let isExisting = false;
                             if (relDoc.exists()) {
                                continue;
                             }
                             const relFields = {
                                participants: sortedIds, type: String(rel.type), confidence: Number(rel.confidence),
                                source: "ai", status: "pending", updatedAt: now
                             };
                             if (!isExisting) relFields.createdAt = now;
                             await setDoc(relRef, relFields, { merge: true });
                          }
                       } else {
                          await updateDoc(doc(db, "products", p.id), { searchStatus: "failed" });
                       }
                    } catch (e) {
                       console.error("Generate error:", e);
                       await updateDoc(doc(db, "products", p.id), { searchStatus: "failed" }).catch(()=>{});
                    }
                 });
                 setTimeout(() => setTriggering(false), 2000);`;

const newCode = `                 const slimCatalog = Object.values(products).map(pr => ({ id: pr.id, name: pr.name, category: pr.category }));
                 const CONCURRENCY = 4;
                 let idx = 0;
                 
                 const processNext = async () => {
                     if (idx >= unready.length) return;
                     const p = unready[idx++];
                     try {
                       await updateDoc(doc(db, "products", p.id), { searchStatus: "processing", processingStartedAt: Date.now() });
                       const res = await fetch("/api/process-product", {
                         method: "POST",
                         headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                         body: JSON.stringify({ productData: { id: p.id, name: p.name, category: p.category }, catalog: slimCatalog })
                       });
                       const result = await res.json();
                       console.log("AI Result for", p.name, ":", result);
                       if (result.status === "success") {
                          await updateDoc(doc(db, "products", p.id), { 
                             searchStatus: "ready", aiSearchAliases: result.aliases, lastProcessedAt: Date.now()
                          });
                          const now = Date.now();
                          for (const rel of result.relationships) {
                             const sortedIds = [p.id, rel.targetId].sort();
                             const relId = sortedIds.join('_');
                             const relRef = doc(db, "productRelationships", relId);
                             const relDoc = await getDoc(relRef);
                             if (relDoc.exists()) continue;
                             const relFields = {
                                participants: sortedIds, type: String(rel.type), confidence: Number(rel.confidence),
                                source: "ai", status: "pending", updatedAt: now, createdAt: now
                             };
                             await setDoc(relRef, relFields, { merge: true });
                          }
                       } else {
                          await updateDoc(doc(db, "products", p.id), { searchStatus: "failed" });
                       }
                     } catch (e) {
                       console.error("Generate error:", e);
                       await updateDoc(doc(db, "products", p.id), { searchStatus: "failed" }).catch(()=>{});
                     }
                     await processNext();
                 };
                 
                 const workers = [];
                 for (let i = 0; i < CONCURRENCY; i++) {
                     workers.push(processNext());
                 }
                 await Promise.all(workers);
                 setTriggering(false);`;

code = code.replace(oldCode, newCode);

// Add stuck products banner
// We need to insert a banner right above the generation button.
const searchDivStr = `<div className="flex flex-wrap items-center justify-between gap-4 mb-4">`;

const stuckProductsLogic = `
      // Detect stuck products
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

const bannerStr = `      {stuckProducts.length > 0 && !triggering && (
        <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-xl flex items-center justify-between gap-4 text-sm font-medium">
           <div>
              <span className="font-bold">{stuckProducts.length} items</span> appear to be stuck in processing (likely due to a previous interruption).
           </div>
           <button onClick={recoverStuckItems} className="shrink-0 px-3 py-1.5 bg-orange-200 hover:bg-orange-300 rounded-lg text-orange-900 font-bold transition-colors">
              Reset Stuck Items
           </button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">`;

if (!code.includes('recoverStuckItems')) {
   const beforeRenderStr = `  return (`;
   code = code.replace(beforeRenderStr, stuckProductsLogic + '\n  return (');
   code = code.replace(searchDivStr, bannerStr);
}

// Update the disabled condition on the button
const buttonStr = `disabled={triggering || processingProducts.length > 0}`;
const newButtonStr = `disabled={triggering || (processingProducts.length > 0 && stuckProducts.length === 0)}`;
code = code.replace(buttonStr, newButtonStr);

fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
