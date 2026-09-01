const fs = require('fs');

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  
  // App.tsx
  code = code.replace(/console\.error\("Firebase fetch error:", err\);/g, "if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Firebase fetch error:', err);");
  code = code.replace(/console\.error\("Seat fetch error:", err\);/g, "if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Seat fetch error:', err);");
  code = code.replace(/console\.error\("Load more error:", err\);/g, "if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Load more error:', err);");

  // Admin components
  code = code.replace(/console\.error\("Fetch products error:", err\);/g, "if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Fetch products error:', err);");
  code = code.replace(/console\.error\("Fetch categories error:", err\);/g, "if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Fetch categories error:', err);");
  code = code.replace(/console\.error\("Fetch users error:", err\);/g, "if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Fetch users error:', err);");
  code = code.replace(/console\.error\("Fetch seats error:", err\);/g, "if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Fetch seats error:', err);");
  
  // General console.error(err);
  code = code.replace(/console\.error\(err\);/g, "if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error(err);");

  fs.writeFileSync(filepath, code);
}

const files = [
  'src/App.tsx',
  'src/components/admin/InventoryManagement.tsx',
  'src/components/admin/CategoryManagement.tsx',
  'src/components/admin/SeatManagement.tsx',
  'src/components/admin/UserManagement.tsx',
  'src/components/AdminLogin.tsx'
];

files.forEach(patchFile);
console.log("Patched errors successfully");
