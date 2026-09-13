const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `<p className="text-[10px] text-gray-500 mt-1 truncate">
                            {product.unit ? product.unit : product.category}
                          </p>`;

if (code.includes(target)) {
    code = code.replaceAll(target, '');
    fs.writeFileSync('src/App.tsx', code);
    console.log("Successfully removed the remaining unit lines.");
} else {
    console.log("Target string not found.");
}
