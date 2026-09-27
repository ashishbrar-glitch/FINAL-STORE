const fs = require('fs');
let file = 'src/components/admin/BackgroundRemovalPOC.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/catch \(err: any\) \{\n      if \(\!err\?\.message\?\.includes\("Unexpected token '<'"\)\) console\.error\(err\);\n      alert\("Error in AI processing: " \+ err\.message\);\n    \}/g, `catch (err: any) {
      if (!err?.message?.includes("Unexpected token '<'") && err.message !== "Failed to fetch") {
        console.error(err);
        alert("Error in AI processing: " + err.message);
      }
    }`);

fs.writeFileSync(file, content);

let categoryFile = 'src/components/admin/CategoryManagement.tsx';
let catContent = fs.readFileSync(categoryFile, 'utf8');
catContent = catContent.replace(/if \(e\.message \!\=\= "Failed to fetch" && \!e\.message\?\.includes\("Unexpected token '<'"\)\) console\.error\(e\);\n      alert\("Failed to auto-translate\. Please enter manually\."\);/g, `if (e.message !== "Failed to fetch" && !e.message?.includes("Unexpected token '<'")) {
        console.error(e);
        alert("Failed to auto-translate. Please enter manually.");
      }`);
fs.writeFileSync(categoryFile, catContent);

let adminCategoryFile = 'src/components/admin/AdminCategoryModal.tsx';
let adminCatContent = fs.readFileSync(adminCategoryFile, 'utf8');
adminCatContent = adminCatContent.replace(/if \(e\.message \!\=\= "Failed to fetch" && \!e\.message\?\.includes\("Unexpected token '<'"\)\) \{\n        console\.error\(e\);\n      \}\n      alert\("Failed to auto-translate\. Please enter manually\."\);/g, `if (e.message !== "Failed to fetch" && !e.message?.includes("Unexpected token '<'")) {
        console.error(e);
        alert("Failed to auto-translate. Please enter manually.");
      }`);
fs.writeFileSync(adminCategoryFile, adminCatContent);

let productModal = 'src/components/admin/AdminProductModal.tsx';
let pmContent = fs.readFileSync(productModal, 'utf8');
pmContent = pmContent.replace(/if \(e\.message \!\=\= "Failed to fetch" && \!e\.message\?\.includes\("Unexpected token '<'"\)\) \{\n        console\.error\(e\);\n      \}\n      alert\("Failed to auto-translate\. Please enter manually\."\);/g, `if (e.message !== "Failed to fetch" && !e.message?.includes("Unexpected token '<'")) {
        console.error(e);
        alert("Failed to auto-translate. Please enter manually.");
      }`);
fs.writeFileSync(productModal, pmContent);

