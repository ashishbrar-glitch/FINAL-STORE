const fs = require('fs');

// Patch App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/    const role = localStorage\.getItem\("adminSessionRole"\);\n    if \(role\) \{\n      setAdminRole\(role\);\n    \}\n/s, '');
appCode = appCode.replace(/        localStorage\.removeItem\("adminSessionRole"\);\n/g, '');
appCode = appCode.replace(/            localStorage\.setItem\("adminSessionRole", role\);\n/g, '');
fs.writeFileSync('src/App.tsx', appCode);

// Patch AdminLogin.tsx
let loginCode = fs.readFileSync('src/components/AdminLogin.tsx', 'utf8');
loginCode = loginCode.replace(/        localStorage\.setItem\('adminSessionRole', data\.role\);\n/g, '');
fs.writeFileSync('src/components/AdminLogin.tsx', loginCode);

// Patch AdminDashboard.tsx
let dashboardCode = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
dashboardCode = dashboardCode.replace(/    localStorage\.removeItem\('adminSessionRole'\);\n/g, '');
fs.writeFileSync('src/components/AdminDashboard.tsx', dashboardCode);

