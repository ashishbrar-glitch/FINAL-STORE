const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminProductModal.tsx', 'utf-8');

// Update handleSubmit to accept mode
code = code.replace(
  'const handleSubmit = async (e: React.FormEvent) => {',
  'const handleSubmit = async (e: React.FormEvent, overrideMode?: "original" | "generated" | "existing") => {'
);

code = code.replace(
  'const mode = submitMode;',
  'const mode = overrideMode || submitMode;'
);

// Update form to not submit automatically, or pass existing
code = code.replace(
  '<form onSubmit={handleSubmit}',
  '<form onSubmit={(e) => handleSubmit(e, "existing")}'
);

// Update buttons to use type="button" and call handleSubmit
code = code.replace(
  '<button type="submit" onClick={() => setSubmitMode(\'original\')}',
  '<button type="button" onClick={(e) => handleSubmit(e as any, \'original\')}'
);
code = code.replace(
  '<button type="submit" onClick={() => setSubmitMode(\'generated\')}',
  '<button type="button" onClick={(e) => handleSubmit(e as any, \'generated\')}'
);
code = code.replace(
  '<button type="submit" onClick={() => setSubmitMode(\'existing\')}',
  '<button type="button" onClick={(e) => handleSubmit(e as any, \'existing\')}'
);

fs.writeFileSync('src/components/admin/AdminProductModal.tsx', code);
