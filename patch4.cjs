const fs = require('fs');

let file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace {product.image} -> {product.image || undefined}
content = content.replace(/src=\{product\.image\}/g, 'src={product.image || undefined}');
content = content.replace(/src=\{cat\.imageUrl\}/g, 'src={cat.imageUrl || undefined}');
content = content.replace(/src=\{item\.image\}/g, 'src={item.image || undefined}');
content = content.replace(/src=\{cartItems\.find\(\(i\) => i\.productId === item\.productId\)\?\.image \|\| ''\}/g, 
  "src={cartItems.find((i) => i.productId === item.productId)?.image || undefined}");

fs.writeFileSync(file, content);
