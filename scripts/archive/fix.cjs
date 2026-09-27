const fs = require('fs');
const file = 'src/components/admin/InventoryManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

// I will just use standard regex and string replacements to clean it up perfectly.
const fixedContent = content.replace(
  /<div className="flex items-center justify-between">[\s\S]*?\{isModalOpen && \(/,
  `<div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">Inventory</h3>
        <button
          onClick={() => { setModalProduct(null); setIsModalOpen(true); }}
          className="flex items-center gap-1 text-sm bg-green-50 text-[#0e783a] px-3 py-1.5 rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {isModalOpen && (`
);

fs.writeFileSync(file, fixedContent);
