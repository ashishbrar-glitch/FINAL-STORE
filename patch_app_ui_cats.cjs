const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove Edit Pencil on categories
const editCatRegex = /\{\s*isAdmin\s*&&\s*\(\s*<button\s*onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*setEditingCategory\(cat\);\s*\}\}\s*className="absolute -top-1 -right-1 z-10 p-1 bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-\[\#0e783a\]"\s*>\s*<Edit2 className="w-3 h-3" \/>\s*<\/button>\s*\)\s*\}/m;
code = code.replace(editCatRegex, '');

// Remove Add New Category button
const addCatRegex = /\{\s*isAdmin\s*&&\s*\(\s*<div className="flex flex-col items-center gap-2 cursor-pointer"\s*onClick=\{\(\) => setEditingCategory\("new"\)\}\s*>\s*<div className="w-14 h-14 bg-green-50 border border-green-200 border-dashed rounded-full flex items-center justify-center text-\[\#0e783a\] shadow-sm"\>\s*<Plus className="w-5 h-5" \/>\s*<\/div>\s*<span className="text-\[11px\] font-semibold text-center leading-tight whitespace-nowrap text-gray-400">Add New<\/span>\s*<\/div>\s*\)\s*\}/m;
code = code.replace(addCatRegex, '');

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx category UI successfully");
