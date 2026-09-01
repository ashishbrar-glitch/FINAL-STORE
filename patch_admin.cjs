const fs = require('fs');

function patchCategory() {
  let content = fs.readFileSync('src/components/admin/CategoryManagement.tsx', 'utf8');
  
  // Add error state
  if (!content.includes('const [error, setError]')) {
    content = content.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\n  const [error, setError] = useState<string | null>(null);');
  }

  // Update fetchCategories
  content = content.replace(
    /if \(err\?.code === 'resource-exhausted' \|\| err\?.message\?\.toLowerCase\(\)\.includes\('quota'\)\) \{[\s\S]*?\} catch \(e\) \{ console\.error\(e\); \}\n\s*\}/,
    `if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        try {
          const snapshot = await getDocsFromCache(query(collection(db, "categories")));
          if (snapshot.empty) {
            setError("Firebase Database quota exceeded for today. Please upgrade your Firebase plan or try again tomorrow.");
          } else {
            processCategories(snapshot);
          }
        } catch (e) { 
          console.error(e); 
          setError("Database quota exceeded and no local cache available.");
        }
      } else {
        setError(err.message);
      }`
  );

  // Update JSX to show error
  content = content.replace(
    /\{categories\.length === 0 && !loading && \([\s\S]*?\}\)/,
    `{error && !loading && (
          <div className="text-center py-8 text-red-500 text-sm font-medium bg-red-50 rounded-xl border border-red-100">
            {error}
          </div>
        )}
        {categories.length === 0 && !loading && !error && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No categories found.
          </div>
        )}`
  );

  fs.writeFileSync('src/components/admin/CategoryManagement.tsx', content);
}

function patchInventory() {
  let content = fs.readFileSync('src/components/admin/InventoryManagement.tsx', 'utf8');
  
  // Add error state
  if (!content.includes('const [error, setError]')) {
    content = content.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\n  const [error, setError] = useState<string | null>(null);');
  }

  // Update fetchProducts
  content = content.replace(
    /if \(err\?.code === 'resource-exhausted' \|\| err\?.message\?\.toLowerCase\(\)\.includes\('quota'\)\) \{[\s\S]*?\} catch \(e\) \{ console\.error\(e\); \}\n\s*\}/,
    `if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        try {
          const snapshot = await getDocsFromCache(query(collection(db, "products")));
          if (snapshot.empty) {
            setError("Firebase Database quota exceeded for today. Please try again tomorrow.");
          } else {
            processProducts(snapshot);
          }
        } catch (e) { 
          console.error(e);
          setError("Database quota exceeded and no local cache available.");
        }
      } else {
        setError(err.message);
      }`
  );

  // Update JSX to show error
  content = content.replace(
    /\{products\.length === 0 && !loading && \([\s\S]*?\}\)/,
    `{error && !loading && (
          <div className="text-center py-8 text-red-500 text-sm font-medium bg-red-50 rounded-xl border border-red-100 mx-4">
            {error}
          </div>
        )}
        {products.length === 0 && !loading && !error && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No items in inventory.
          </div>
        )}`
  );

  fs.writeFileSync('src/components/admin/InventoryManagement.tsx', content);
}

patchCategory();
patchInventory();
