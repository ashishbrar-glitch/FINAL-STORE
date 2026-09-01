const fs = require('fs');
let code = fs.readFileSync('src/components/admin/InventoryManagement.tsx', 'utf8');

const targetStr = `import { 
  collection, 
  query, 
  getDocs, 
  doc,`;

const replaceStr = `import { 
  collection, 
  query, 
  getDocs, 
  getDocsFromCache,
  doc,`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
}

const target2 = `  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, "categories")));
      const catList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(catList);
    } catch (err) {
      console.error(err);
    }
  };`;

const replace2 = `  const fetchCategories = async () => {
    const processCategories = (snapshot: any) => {
      const catList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setCategories(catList);
    };
    try {
      const snapshot = await getDocs(query(collection(db, "categories")));
      processCategories(snapshot);
    } catch (err: any) {
      console.error("Fetch categories error:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        try {
          const snapshot = await getDocsFromCache(query(collection(db, "categories")));
          processCategories(snapshot);
        } catch (e) {
           console.error(e);
        }
      }
    }
  };`;

if (code.includes(target2)) {
  code = code.replace(target2, replace2);
}

const target3 = `  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'));
      const snapshot = await getDocs(q);
      const prodList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(prodList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };`;

const replace3 = `  const fetchProducts = async () => {
    setLoading(true);
    const processProducts = (snapshot: any) => {
      const prodList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setProducts(prodList);
    };
    try {
      const q = query(collection(db, 'products'));
      const snapshot = await getDocs(q);
      processProducts(snapshot);
    } catch (err: any) {
      console.error("Fetch products error:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        try {
          const snapshot = await getDocsFromCache(query(collection(db, "products")));
          processProducts(snapshot);
        } catch (e) {
           console.error(e);
        }
      }
    } finally {
      setLoading(false);
    }
  };`;

if (code.includes(target3)) {
  code = code.replace(target3, replace3);
  fs.writeFileSync('src/components/admin/InventoryManagement.tsx', code);
  console.log("Patched InventoryManagement successfully");
} else {
  console.log("Could not find targets in InventoryManagement.");
}
