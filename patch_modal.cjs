const fs = require('fs');
const file = 'src/components/admin/AdminProductModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state
const targetState = 'const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);';
const replaceState = 'const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);\n  const [isBestseller, setIsBestseller] = useState(product?.isBestseller ?? false);';

content = content.replace(targetState, replaceState);

// 2. Add to dataToSave
const targetData = 'isAvailable,';
const replaceData = 'isAvailable,\n        isBestseller,';

content = content.replace(targetData, replaceData);

// 3. Add checkbox
const targetUI = `<label htmlFor="modalIsAvailable" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  In Stock (Available for purchase)
                </label>
              </div>`;
const replaceUI = `<label htmlFor="modalIsAvailable" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  In Stock (Available for purchase)
                </label>
              </div>
              <div className="flex items-center gap-3 bg-red-50 p-3.5 rounded-xl border border-red-100 mt-2">
                <input
                  type="checkbox"
                  id="modalIsBestseller"
                  checked={isBestseller}
                  onChange={(e) => setIsBestseller(e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-white border-red-300 rounded focus:ring-red-500"
                />
                <label htmlFor="modalIsBestseller" className="text-sm font-semibold text-red-800 cursor-pointer flex items-center gap-1.5">
                  🌟 Bestseller (Highlight this item)
                </label>
              </div>`;

content = content.replace(targetUI, replaceUI);

fs.writeFileSync(file, content);
console.log("Patched AdminProductModal.tsx");
