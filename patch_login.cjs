const fs = require('fs');
let code = fs.readFileSync('src/components/AdminLogin.tsx', 'utf8');

const loginRegex = /const handleLogin = async \(e: React\.FormEvent\) => \{[\s\S]*?\} finally \{\s*setLoading\(false\);\s*\}\s*\};/;

const loginReplace = `const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const processLogin = (snapshot: any) => {
      if (snapshot.empty) {
        setError('Invalid email or password.');
        setLoading(false);
        return;
      }

      let loggedIn = false;
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.password === password) { 
           loggedIn = true;
           localStorage.setItem('adminSessionRole', data.role);
           onLoginSuccess(data.role);
        }
      });

      if (!loggedIn) {
        setError('Invalid email or password.');
      }
    };

    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
      processLogin(snapshot);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
         try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const snapshot = await getDocsFromCache(q);
            processLogin(snapshot);
         } catch(e) {
            setError('System is offline/quota exceeded. Cannot verify credentials.');
         }
      } else {
        setError('An error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };`;

code = code.replace(loginRegex, loginReplace);
fs.writeFileSync('src/components/AdminLogin.tsx', code);
console.log("Patched AdminLogin successfully");
