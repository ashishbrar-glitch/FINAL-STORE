const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

const oldRunMigration = /const runMigration = async \(\) => \{[\s\S]*?\}\n       alert\(`Migration complete\. Created \$\{migrated\} directional recommendations\.`\);\n     \} catch \(e\) \{\n       console\.error\("Migration error:", e\);\n       alert\("Migration failed\."\);\n     \}\n  \};/;

const newRunMigration = `const runMigration = async () => {
     if (!confirm("Are you sure you want to migrate old productRelationships to productRecommendations? This is safe to run multiple times.")) return;
     try {
       const user = auth.currentUser;
       if (!user) {
         alert("Not authenticated.");
         return;
       }
       const token = await user.getIdToken();
       const res = await fetch('/api/migrate-product-recommendations', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': \`Bearer \${token}\`
         }
       });
       
       const result = await res.json();
       if (!res.ok) {
          throw new Error(result.error || "Failed to migrate");
       }
       alert(\`Migration complete. Scanned: \${result.scanned}, Created: \${result.created}, Skipped (existing): \${result.skippedExisting}, Skipped (invalid): \${result.skippedInvalid}\`);
     } catch (e: any) {
       console.error("Migration error:", e);
       alert("Migration failed: " + e.message);
     }
  };`;

code = code.replace(oldRunMigration, newRunMigration);

if (!code.includes('import { auth } from')) {
    code = code.replace(/import \{ db \}/, 'import { db, auth }');
}

fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
