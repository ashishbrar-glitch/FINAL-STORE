const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

// Update slimCatalog to include isActive and isAvailable
code = code.replace(
  `const slimCatalog = Object.values(products).map(pr => ({ id: pr.id, name: pr.name, category: pr.category }));`,
  `const slimCatalog = Object.values(products).map(pr => ({ id: pr.id, name: pr.name, category: pr.category, isActive: pr.isActive, isAvailable: pr.isAvailable }));`
);

// Update document creation logic in processNext
const oldCreation = /for \(const rel of result.relationships\) \{.*?await setDoc\(relRef, relFields, \{ merge: true \}\);\n                          \}/s;

const newCreation = `for (const rel of result.relationships) {
                             const relId = \`\${p.id}_\${rel.targetId}\`;
                             const relRef = doc(db, "productRecommendations", relId);
                             const relDoc = await getDoc(relRef);
                             if (relDoc.exists()) continue;
                             const relFields = {
                                sourceProductId: p.id,
                                targetProductId: rel.targetId,
                                type: String(rel.type),
                                placement: String(rel.placement),
                                confidence: Number(rel.confidence),
                                priority: Number(rel.priority),
                                categoryFit: Number(rel.categoryFit),
                                priceFit: Number(rel.priceFit),
                                bestsellerBoost: Number(rel.bestsellerBoost),
                                source: "ai",
                                status: "pending",
                                updatedAt: now,
                                createdAt: now
                             };
                             await setDoc(relRef, relFields, { merge: true });
                          }`;

code = code.replace(oldCreation, newCreation);

// Replace state loading
code = code.replace(
  `const relsRef = collection(db, 'productRelationships');`,
  `const relsRef = collection(db, 'productRecommendations');`
);

code = code.replace(
  `await deleteDoc(doc(db, "productRelationships", id));`,
  `await deleteDoc(doc(db, "productRecommendations", id));`
);

code = code.replace(
  `const relRef = doc(db, "productRelationships", id);`,
  `const relRef = doc(db, "productRecommendations", id);`
);

// Manual add logic
const oldAdd = `const sortedIds = [newRel.p1, newRel.p2].sort();
      const relId = sortedIds.join('_');
      const relRef = doc(db, "productRelationships", relId);
      await setDoc(relRef, {
        participants: sortedIds,`;

const newAdd = `const relId = \`\${newRel.p1}_\${newRel.p2}\`;
      const relRef = doc(db, "productRecommendations", relId);
      await setDoc(relRef, {
        sourceProductId: newRel.p1,
        targetProductId: newRel.p2,`;

code = code.replace(oldAdd, newAdd);

// Render logic
const oldRender = /const p1 = products\[r.participants\?\.\[0\]\];\s*const p2 = products\[r.participants\?\.\[1\]\];/s;
const newRender = `const p1 = products[r.sourceProductId];\n           const p2 = products[r.targetProductId];`;
code = code.replace(oldRender, newRender);

const oldTags = /<span className="bg-gray-200\/50 px-1\.5 py-0\.5 rounded">\{r\.type\}<\/span>\s*<span>Conf: \{Math\.round\(\(r\.confidence\|\|0\)\*100\)\}%<\/span>/s;
const newTags = `<span className="bg-gray-200/50 px-1.5 py-0.5 rounded">{r.type}</span>
                    <span className="bg-blue-100/50 text-blue-700 px-1.5 py-0.5 rounded">{r.placement || 'goes_well_with'}</span>
                    <span>Prio: {r.priority}</span>
                    <span>Conf: {Math.round((r.confidence||0)*100)}%</span>`;
code = code.replace(oldTags, newTags);

fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
