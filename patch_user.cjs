const fs = require('fs');
let code = fs.readFileSync('src/components/admin/UserManagement.tsx', 'utf8');

code = code.replace(/getDocs,/, 'getDocs, getDocsFromCache,');

const fetchUserRegex = /const fetchUsers = async \(\) => \{\s*try \{\s*const q = query\(collection\(db, 'users'\)\);\s*const snapshot = await getDocs\(q\);\s*const userList = snapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\)\);\s*setUsers\(userList\);\s*\} catch \(err\) \{\s*console\.error\(err\);\s*\} finally \{\s*setLoading\(false\);\s*\}\s*\};/g;

const fetchUserReplace = `const fetchUsers = async () => {
    const processUsers = (snapshot: any) => {
      const userList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    };
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      processUsers(snapshot);
    } catch (err: any) {
      console.error("Fetch users error:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        try {
          const snapshot = await getDocsFromCache(query(collection(db, 'users')));
          processUsers(snapshot);
        } catch (e) { console.error(e); }
      }
    } finally {
      setLoading(false);
    }
  };`;

code = code.replace(fetchUserRegex, fetchUserReplace);
fs.writeFileSync('src/components/admin/UserManagement.tsx', code);
console.log("Patched UserManagement successfully");
