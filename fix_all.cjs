const fs = require('fs');
const file = 'src/components/admin/AdminProductModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix the useState destructuring error:
content = content.replace(
  /const \[isAvailable,[\s\S]*?setIsAvailable\] = useState\(product\?\.isAvailable \?\? true\);/,
  'const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);'
);

// Check if dataToSave has isBestseller
if (!content.includes('isBestseller,\n        nameHi')) {
  content = content.replace(
    'isAvailable,\n        nameHi',
    'isAvailable,\n        isBestseller,\n        nameHi'
  );
}

fs.writeFileSync(file, content);
