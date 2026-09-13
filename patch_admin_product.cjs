const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminProductModal.tsx', 'utf-8');

// 1. Add state
code = code.replace(
  `const [nameHi, setNameHi] = useState(product?.nameHi || '');`,
  `const [nameHi, setNameHi] = useState(product?.nameHi || '');\n  const [nameEn, setNameEn] = useState(product?.nameEn || '');`
);

// 2. Add input
const inputReplaceStr = `<div className="relative">
                  <input
                    type="text"
                    placeholder="Hindi Name"`;

const newInputStr = `<input
                  type="text"
                  placeholder="English Name / AI Search Keywords"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value.toLowerCase())}
                  className="w-full text-sm px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Hindi Name"`;

code = code.replace(inputReplaceStr, newInputStr);

// 3. Add to dataToSave
const dataToSaveReplace = `nameHi: nameHi || product?.nameHi || '',
        mrp: product?.mrp || 0,`;
const dataToSaveNew = `nameHi: nameHi || product?.nameHi || '',
        nameEn: nameEn || product?.nameEn || '',
        mrp: product?.mrp || 0,`;

code = code.replace(dataToSaveReplace, dataToSaveNew);

fs.writeFileSync('src/components/admin/AdminProductModal.tsx', code);
