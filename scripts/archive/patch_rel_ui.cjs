const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

const oldCode = `                 unready.forEach(p => {
                    fetch("/api/process-product", {
                      method: "POST",
                      headers: {
                         "Content-Type": "application/json",
                         "Authorization": "Bearer " + token
                      },
                      body: JSON.stringify({ productId: p.id })
                    }).catch(() => {});
                 });`;

const newCode = `                 const { doc, getDoc, updateDoc, setDoc } = require('firebase/firestore');
                 unready.forEach(async p => {
                    try {
                       await updateDoc(doc(db, "products", p.id), { searchStatus: "processing" });
                       const res = await fetch("/api/process-product", {
                         method: "POST",
                         headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                         body: JSON.stringify({ productData: p, catalog: Object.values(products) })
                       });
                       const result = await res.json();
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
                                const f = relDoc.data();
                                if (f.status === "approved" || f.status === "blocked") continue;
                                isExisting = true;
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
                       await updateDoc(doc(db, "products", p.id), { searchStatus: "failed" }).catch(()=>{});
                    }
                 });`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
