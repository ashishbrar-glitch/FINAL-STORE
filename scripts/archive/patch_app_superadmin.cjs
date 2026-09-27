const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /if \(\!d\.exists\(\)\) \{\n\s*await setDoc\(doc\(db, "users", user\.uid\), \{ email: user\.email, role: 'superadmin', createdAt: Date\.now\(\) \}\);\n\s*setAdminRole\('superadmin'\);\n\s*localStorage\.setItem\("adminSessionRole", "superadmin"\);\n\s*\} else \{/s,
  `if (!d.exists()) {
            setAdminRole(null);
            localStorage.removeItem("adminSessionRole");
            if (currentView === "admin-dashboard") {
              setCurrentView("admin-login");
            }
          } else {`
);

fs.writeFileSync('src/App.tsx', code);
