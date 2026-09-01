const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  // Fetch initial products and categories
  const fetchData = async () => {
    try {
      // Fetch Categories
      const catSnap = await getDocs(collection(db, "categories"));
      let catList = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      catList.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      
      // Default categories if none exist in DB
      if (catList.length === 0) {
        catList = [
          { id: "veg", nameEn: "Vegetables", nameHi: "सब्ज़ियाँ", emoji: "🥦", displayOrder: 1, isActive: true },
          { id: "gro", nameEn: "Grocery", nameHi: "किराना", emoji: "🛍️", displayOrder: 2, isActive: true },
          { id: "sna", nameEn: "Snacks", nameHi: "नाश्ते", emoji: "🍪", displayOrder: 3, isActive: true },
          { id: "per", nameEn: "Personal Care", nameHi: "पर्सनल केयर", emoji: "🧴", displayOrder: 4, isActive: true },
        ];
      }
      setDbCategories(catList);

      // Fetch Products
      const q = query(collection(db, "products"), limit(40));
      const snapshot = await getDocs(q);
      if (snapshot.docs.length > 0) {
        setLastProductDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMoreProducts(snapshot.docs.length === 40);
      const prodList = snapshot.docs.map((doc, idx) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          nameHi: data.nameHi,
          price: data.price,
          mrp: data.mrp,
          category: catList.find(c => c.id === (data.categoryId || data.category))?.nameEn || data.category || data.categoryId || "Uncategorized",
          image: data.imageUrl || data.image,
          unit: data.unit,
          isActive: data.isActive ?? true,
          isAvailable: data.isAvailable ?? true,
          isBestseller: data.isBestseller ?? (idx === 0 || idx === 3),
        };
      }) as Product[];
      setProducts(prodList);
      setDisplayedProducts(prodList);
    } catch (err) {
      console.error(err);
    }
  };`;

const replaceStr = `  // Fetch initial products and categories
  const fetchData = async () => {
    const processData = (catSnap: any, snapshot: any) => {
      let catList = catSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Category));
      catList.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
      
      if (catList.length === 0) {
        catList = [
          { id: "veg", nameEn: "Vegetables", nameHi: "सब्ज़ियाँ", emoji: "🥦", displayOrder: 1, isActive: true },
          { id: "gro", nameEn: "Grocery", nameHi: "किराना", emoji: "🛍️", displayOrder: 2, isActive: true },
          { id: "sna", nameEn: "Snacks", nameHi: "नाश्ते", emoji: "🍪", displayOrder: 3, isActive: true },
          { id: "per", nameEn: "Personal Care", nameHi: "पर्सनल केयर", emoji: "🧴", displayOrder: 4, isActive: true },
        ];
      }
      setDbCategories(catList);

      if (snapshot.docs.length > 0) {
        setLastProductDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMoreProducts(snapshot.docs.length === 40);
      const prodList = snapshot.docs.map((doc: any, idx: number) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          nameHi: data.nameHi,
          price: data.price,
          mrp: data.mrp,
          category: catList.find((c: any) => c.id === (data.categoryId || data.category))?.nameEn || data.category || data.categoryId || "Uncategorized",
          image: data.imageUrl || data.image,
          unit: data.unit,
          isActive: data.isActive ?? true,
          isAvailable: data.isAvailable ?? true,
          isBestseller: data.isBestseller ?? (idx === 0 || idx === 3),
        };
      }) as Product[];
      setProducts(prodList);
      setDisplayedProducts(prodList);
    };

    try {
      // Try fetching fresh data first
      const catSnap = await getDocs(collection(db, "categories"));
      const q = query(collection(db, "products"), limit(40));
      const snapshot = await getDocs(q);
      processData(catSnap, snapshot);
    } catch (err: any) {
      console.error("Firebase fetch error:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        // Fallback to cache if quota exceeded
        try {
          console.log("Quota exceeded. Attempting to load from local cache...");
          const catSnap = await getDocsFromCache(collection(db, "categories"));
          const q = query(collection(db, "products"), limit(40));
          const snapshot = await getDocsFromCache(q);
          processData(catSnap, snapshot);
        } catch (cacheErr) {
          console.error("Cache fallback failed:", cacheErr);
          // Ultimate fallback (dummy data) just so the app doesn't go totally blank
          setDbCategories([
            { id: "gro", nameEn: "Grocery", nameHi: "किराना", emoji: "🛍️", displayOrder: 1, isActive: true }
          ]);
          setDisplayedProducts([
            { id: "1", name: "PATAKA TEA 250GM (Offline Mode)", price: 100, category: "Grocery", image: "https://m.media-amazon.com/images/I/71R2nJgW-uL._SL1000_.jpg", isActive: true, isAvailable: true, isBestseller: true }
          ]);
        }
      }
    }
  };`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched fetchData successfully");
} else {
  console.log("Could not find fetchData target string.");
}
