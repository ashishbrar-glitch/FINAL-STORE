const fs = require('fs');

function fixAppTsx() {
  let content = fs.readFileSync('src/App.tsx', 'utf8');
  content = content.replace(
    /const snapshot = await getDocsFromCache\(q\);\s*processData\(catSnap, snapshot\);/,
    `const snapshot = await getDocsFromCache(q);
          if (catSnap.empty && snapshot.empty) {
            throw new Error("Cache is empty");
          }
          processData(catSnap, snapshot);`
  );
  content = content.replace(/const q = query\(collection\(db, "products"\), limit\(40\)\);/g, 'const q = query(collection(db, "products"));');
  fs.writeFileSync('src/App.tsx', content);
}

fixAppTsx();
