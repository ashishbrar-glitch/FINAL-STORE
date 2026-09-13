const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace limit(40) in onSnapshot
code = code.replace(
  /onSnapshot\(query\(collection\(db, "products"\), limit\(40\)\),/g,
  'onSnapshot(query(collection(db, "products")),'
);

// We should also remove loadMoreProducts function and any intersection observer.
// We can just stub loadMoreProducts to be empty.
const loadMoreTarget = `  const loadMoreProducts = async () => {`;
if (code.includes(loadMoreTarget)) {
   code = code.replace(loadMoreTarget, `  const loadMoreProducts = async () => { return; /* Disabled to load all */`);
}

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed limit in App.tsx");
