const fs = require('fs');
let code = fs.readFileSync('src/components/admin/InventoryManagement.tsx', 'utf8');

code = code.replace(/getDocs,/, 'getDocs,\n  getDocsFromCache,');

const fetchCatRegex = /const fetchCategories = async \(\) => \{\s*try \{\s*const snapshot = await getDocs\(query\(collection\(db, "categories"\)\)\);\s*const catList = snapshot\.docs\.map\(\(doc\) => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\)\);\s*setCategories\(catList\);\s*if \(catList\.length > 0 && !category\) \{\s*setCategory\(catList\[0\]\.id\);\s*\}\s*\} catch \(err\) \{\s*console\.error\(err\);\s*\}\s*\};/g;

const fetchCatReplace = `const fetchCategories = async () => {
    const processCategories = (snapshot: any) => {
      const catList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setCategories(catList);
      if (catList.length > 0 && !category) {
        setCategory(catList[0].id);
      }
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
        } catch (e) { console.error(e); }
      }
    }
  };`;
  
code = code.replace(fetchCatRegex, fetchCatReplace);

const fetchProdRegex = /const fetchProducts = async \(\) => \{\s*try \{\s*const q = query\(collection\(db, "products"\)\);\s*const snapshot = await getDocs\(q\);\s*const prodList = snapshot\.docs\.map\(\(doc\) => \(\{\s*id: doc\.id,\s*\.\.\.doc\.data\(\),\s*\}\)\);\s*setProducts\(prodList\);\s*\} catch \(err\) \{\s*console\.error\(err\);\s*\} finally \{\s*setLoading\(false\);\s*\}\s*\};/g;

const fetchProdReplace = `const fetchProducts = async () => {
    const processProducts = (snapshot: any) => {
      const prodList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(prodList);
    };
    try {
      const q = query(collection(db, "products"));
      const snapshot = await getDocs(q);
      processProducts(snapshot);
    } catch (err: any) {
      console.error("Fetch products error:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        try {
          const snapshot = await getDocsFromCache(query(collection(db, "products")));
          processProducts(snapshot);
        } catch (e) { console.error(e); }
      }
    } finally {
      setLoading(false);
    }
  };`;
  
code = code.replace(fetchProdRegex, fetchProdReplace);

fs.writeFileSync('src/components/admin/InventoryManagement.tsx', code);
console.log("Patched InventoryManagement successfully");
