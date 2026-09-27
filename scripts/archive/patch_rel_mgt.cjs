const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

const regex = /const res = await fetch\("\/api\/process-product", \{[\s\S]*?\} else \{\n\s*await updateDoc\(doc\(db, "products", p\.id\), \{ searchStatus: "failed" \}\);\n\s*\}/s;

const replacement = `const res = await fetch("/api/process-product", {
                         method: "POST",
                         headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                         body: JSON.stringify({ productId: p.id })
                       });
                       const result = await res.json();
                       console.log("AI Result for", p.name, ":", result);
                       if (result.status !== "success") {
                          await updateDoc(doc(db, "products", p.id), { searchStatus: "failed" });
                       }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
