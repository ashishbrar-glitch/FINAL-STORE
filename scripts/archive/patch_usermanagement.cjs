const fs = require('fs');
let code = fs.readFileSync('src/components/admin/UserManagement.tsx', 'utf8');

const regex = /const handleCreateUser = async \(e: React\.FormEvent\) => \{[\s\S]*?setShowAddForm\(false\);\n\s*fetchUsers\(\);\n\s*\} catch \(err: any\) \{/s;

const replacement = `const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ email, password, role })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }
      
      alert("User created successfully!");
      setEmail('');
      setPassword('');
      setRole('manager');
      setShowAddForm(false);
      fetchUsers();
    } catch (err: any) {`;

code = code.replace(regex, replacement);

if (!code.includes('import { auth } from')) {
    code = code.replace(/import \{ db \}/, 'import { db, auth }');
}

fs.writeFileSync('src/components/admin/UserManagement.tsx', code);
