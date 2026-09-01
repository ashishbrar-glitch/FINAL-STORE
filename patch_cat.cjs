const fs = require('fs');
let code = fs.readFileSync('src/components/admin/CategoryManagement.tsx', 'utf8');

code = code.replace(/getDocs,/, 'getDocs,\n  getDocsFromCache,');

const fetchCatRegex = /const fetchCategories = async \(\) => \{\s*try \{\s*const q = query\(collection\(db, "categories"\)\);\s*const snapshot = await getDocs\(q\);\s*const catList = snapshot\.docs\.map\(\(doc\) => \(\{\s*id: doc\.id,\s*\.\.\.doc\.data\(\),\s*\}\)\);\s*catList\.sort\(\(a: any, b: any\) => \(a\.displayOrder \|\| 0\) - \(b\.displayOrder \|\| 0\)\);\s*setCategories\(catList\);\s*\} catch \(err\) \{\s*console\.error\(err\);\s*\} finally \{\s*setLoading\(false\);\s*\}\s*\};/g;

const fetchCatReplace = `const fetchCategories = async () => {
    const processCategories = (snapshot: any) => {
      const catList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      catList.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setCategories(catList);
    };
    try {
      const q = query(collection(db, "categories"));
      const snapshot = await getDocs(q);
      processCategories(snapshot);
    } catch (err: any) {
      console.error("Fetch categories error:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        try {
          const snapshot = await getDocsFromCache(query(collection(db, "categories")));
          processCategories(snapshot);
        } catch (e) { console.error(e); }
      }
    } finally {
      setLoading(false);
    }
  };`;

code = code.replace(fetchCatRegex, fetchCatReplace);
fs.writeFileSync('src/components/admin/CategoryManagement.tsx', code);
console.log("Patched CategoryManagement successfully");
