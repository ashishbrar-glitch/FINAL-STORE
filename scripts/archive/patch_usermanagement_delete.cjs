const fs = require('fs');
let code = fs.readFileSync('src/components/admin/UserManagement.tsx', 'utf8');

const regex = /const handleDeleteUser = async \(uid: string\) => \{[\s\S]*?\}\n  \};/s;
const replacement = `const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("Are you sure?")) return;
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      
      const res = await fetch(\`/api/admin/users/\${uid}\`, {
        method: 'DELETE',
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }
      
      fetchUsers();
    } catch (err: any) {
      alert("Error deleting user: " + err.message);
    }
  };`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/admin/UserManagement.tsx', code);
