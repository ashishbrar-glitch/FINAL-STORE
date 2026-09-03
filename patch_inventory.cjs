const fs = require('fs');
const file = 'src/components/admin/InventoryManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the imports to include AdminProductModal
content = content.replace(
  "import { BackgroundRemovalPOC } from \"./BackgroundRemovalPOC\";",
  "import { BackgroundRemovalPOC } from \"./BackgroundRemovalPOC\";\nimport { AdminProductModal } from \"./AdminProductModal\";"
);

// Add the modal state variables
content = content.replace(
  "const [showAddForm, setShowAddForm] = useState(false);",
  "const [showAddForm, setShowAddForm] = useState(false);\n  const [modalProduct, setModalProduct] = useState<any | null>(null);\n  const [isModalOpen, setIsModalOpen] = useState(false);"
);

// Replace handleEdit
content = content.replace(
  /const handleEdit = \(product: any\) => \{[\s\S]*?setShowAddForm\(true\);\n  \};/,
  `const handleEdit = (product: any) => {
    setModalProduct(product);
    setIsModalOpen(true);
  };`
);

// We need to replace the form toggling block:
const formRegex = /<button[\s\S]*?onClick=\{\(\) => \(showAddForm \? resetForm\(\) : setShowAddForm\(true\)\)\}[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?\{showAddForm && \([\s\S]*?<form[\s\S]*?<\/form>\n      \)\}/;

const newFormToggle = `<button
          onClick={() => { setModalProduct(null); setIsModalOpen(true); }}
          className="flex items-center gap-1 text-sm bg-green-50 text-[#0e783a] px-3 py-1.5 rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {isModalOpen && (
        <AdminProductModal 
          product={modalProduct}
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => setIsModalOpen(false)}
        />
      )}`;

content = content.replace(formRegex, newFormToggle);

fs.writeFileSync(file, content);
console.log("Patched Inventory Management");
