const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminProductModal.tsx', 'utf8');

const oldModalRel = /for \(const rel of result\.relationships\) \{.*?await setDoc\(relRef, relFields, \{ merge: true \}\);\n              \}/s;

const newModalRel = `for (const rel of result.relationships) {
                 const relId = \`\${productId}_\${rel.targetId}\`;
                 const relRef = doc(db, "productRecommendations", relId);
                 const relDoc = await getDoc(relRef);
                 if (relDoc.exists()) continue;
                 const relFields = {
                    sourceProductId: productId,
                    targetProductId: rel.targetId,
                    type: String(rel.type),
                    placement: String(rel.placement || (rel.type === 'complementary' ? 'goes_well_with' : 'similar_products')),
                    confidence: Number(rel.confidence),
                    priority: Number(rel.priority || (rel.type === 'complementary' ? 80 : 50)),
                    categoryFit: Number(rel.categoryFit || 1),
                    priceFit: Number(rel.priceFit || 1),
                    bestsellerBoost: Number(rel.bestsellerBoost || 0),
                    source: "ai",
                    status: "pending",
                    updatedAt: now,
                    createdAt: now
                 };
                 await setDoc(relRef, relFields, { merge: true });
              }`;

code = code.replace(oldModalRel, newModalRel);
fs.writeFileSync('src/components/admin/AdminProductModal.tsx', code);
