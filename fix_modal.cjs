const fs = require('fs');
const file = 'src/components/admin/AdminProductModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// I'll replace everything from "const [isAvailable" to the end of the line with "useState(product?.isBestseller ?? false);"
content = content.replace(
  /const \[isAvailable,[\s\S]*?setIsBestseller\] = useState\(product\?\.isBestseller \?\? false\);/,
  "const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);\n  const [isBestseller, setIsBestseller] = useState(product?.isBestseller ?? false);"
);

fs.writeFileSync(file, content);
console.log("Fixed syntax");
