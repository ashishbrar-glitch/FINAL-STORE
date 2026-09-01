const fs = require('fs');
let code = fs.readFileSync('src/components/admin/InventoryManagement.tsx', 'utf8');

// 1. Add state for isAvailable
code = code.replace(/const \[price, setPrice\] = useState\(""\);/, 'const [price, setPrice] = useState("");\n  const [isAvailable, setIsAvailable] = useState(true);');

// 2. resetForm
code = code.replace(/setEditingId\(null\);/, 'setEditingId(null);\n    setIsAvailable(true);');

// 3. handleEdit
code = code.replace(/setEditingId\(product\.id\);/, 'setEditingId(product.id);\n    setIsAvailable(product.isAvailable !== false);');

// 4. dataToSave - replace hardcoded isAvailable
code = code.replace(/isAvailable: true,/, 'isAvailable: isAvailable,');

// 5. Add checkbox in form
const checkboxHtml = `
          <div className="flex items-center gap-2 mt-2 bg-white p-3 rounded-xl border border-gray-100">
            <input
              type="checkbox"
              id="isAvailable"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4 h-4 text-[#0e783a] bg-gray-100 border-gray-300 rounded focus:ring-[#0e783a]"
            />
            <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">
              In Stock (Available for purchase)
            </label>
          </div>
`;
code = code.replace(/<button\s*type="submit"\s*disabled=\{actionLoading\}/, checkboxHtml + '\n          <button type="submit" disabled={actionLoading}');

// 6. Show status in product list
const statusHtml = `
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-[#0e783a]">₹{product.price}</span>
                    {!product.isAvailable && (
                       <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded text-center">Out of Stock</span>
                    )}
                  </div>
`;
code = code.replace(/<div className="font-bold text-\[\#0e783a\]">₹\{product\.price\}<\/div>/, statusHtml);

fs.writeFileSync('src/components/admin/InventoryManagement.tsx', code);
console.log("Patched InventoryManagement stock successfully");
