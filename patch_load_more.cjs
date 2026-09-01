const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const loadMoreProducts = async () => {
    if (!lastProductDoc) return;
    try {
      const q = query(collection(db, "products"), startAfter(lastProductDoc), limit(40));
      const snapshot = await getDocs(q);
      
      const newProds = snapshot.docs.map((doc, idx) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          nameHi: data.nameHi,
          price: data.price,
          mrp: data.mrp,
          category: dbCategories.find(c => c.id === (data.categoryId || data.category))?.nameEn || data.category || data.categoryId || "Uncategorized",
          image: data.imageUrl || data.image,
          unit: data.unit,
          isActive: data.isActive ?? true,
          isAvailable: data.isAvailable ?? true,
          isBestseller: data.isBestseller ?? false,
        };
      });
      
      setProducts(prev => [...prev, ...newProds]);
      
      if (snapshot.docs.length > 0) {
        setLastProductDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMoreProducts(snapshot.docs.length === 40);
    } catch (err) {
      console.error(err);
    }
  };`;

const replaceStr = `  const loadMoreProducts = async () => {
    if (!lastProductDoc) return;
    
    const processSnapshot = (snapshot: any) => {
      const newProds = snapshot.docs.map((doc: any, idx: number) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          nameHi: data.nameHi,
          price: data.price,
          mrp: data.mrp,
          category: dbCategories.find((c: any) => c.id === (data.categoryId || data.category))?.nameEn || data.category || data.categoryId || "Uncategorized",
          image: data.imageUrl || data.image,
          unit: data.unit,
          isActive: data.isActive ?? true,
          isAvailable: data.isAvailable ?? true,
          isBestseller: data.isBestseller ?? false,
        };
      });
      
      setProducts(prev => [...prev, ...newProds]);
      
      if (snapshot.docs.length > 0) {
        setLastProductDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMoreProducts(snapshot.docs.length === 40);
    };

    try {
      const q = query(collection(db, "products"), startAfter(lastProductDoc), limit(40));
      const snapshot = await getDocs(q);
      processSnapshot(snapshot);
    } catch (err: any) {
      console.error("Load more error:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        try {
          const q = query(collection(db, "products"), startAfter(lastProductDoc), limit(40));
          const snapshot = await getDocsFromCache(q);
          processSnapshot(snapshot);
        } catch (cacheErr) {
          console.error("Cache fallback failed for load more:", cacheErr);
        }
      }
    }
  };`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched loadMoreProducts successfully");
} else {
  console.log("Could not find loadMoreProducts target string.");
}
