const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove the Add New Item button block
const addButtonRegex = /\{\s*isAdmin\s*&&\s*\(\s*<div className="mb-4">\s*<button\s*onClick=\{\(\) => setEditingProduct\("new"\)\}\s*className="w-full bg-green-50 text-\[\#0e783a\] py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-green-200 border-dashed"\s*>\s*<Plus className="w-5 h-5" \/> Add New Item\s*<\/button>\s*<\/div>\s*\)\s*\}/m;
code = code.replace(addButtonRegex, '');

// Remove the Edit Pencil button block
const editPencilRegex = /\{\s*isAdmin\s*&&\s*\(\s*<button\s*onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*setEditingProduct\(product\);\s*\}\}\s*className="absolute -top-1 -right-1 z-20 p-1\.5 bg-white border border-gray-200 rounded-full shadow-md text-gray-500 hover:text-\[\#0e783a\]"\s*>\s*<Edit2 className="w-3 h-3" \/>\s*<\/button>\s*\)\s*\}/m;
// Since there might be multiple occurrences in different places? Let's use global replace.
code = code.replace(new RegExp(editPencilRegex.source, 'g'), '');

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx admin UI successfully");
