const fs = require('fs');

function stripImages(obj) {
  if (Array.isArray(obj)) {
    return obj.map(stripImages);
  } else if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const key of Object.keys(obj)) {
      if (key === 'image' || key === 'imageUrl') {
        result[key] = (typeof obj[key] === 'string' && obj[key].length > 50) ? 
           obj[key].substring(0, 50) + "... [TRUNCATED]" : obj[key];
      } else {
        result[key] = stripImages(obj[key]);
      }
    }
    return result;
  }
  return obj;
}

const data = JSON.parse(fs.readFileSync('bcnstore-backup-2026-09-02.json', 'utf8'));
const categories = data.categories || [];
const products = data.products || [];

let output = "=== IMPORT ANALYSIS ===\n";
output += `Found ${categories.length} categories to import.\n`;
output += `Found ${products.length} products to import.\n\n`;

if (categories.length > 0) {
  output += "Sample Category (will preserve ID and fields):\n";
  output += JSON.stringify(stripImages(categories[0]), null, 2) + "\n\n";
}

if (products.length > 0) {
  output += "Sample Product (will preserve ID and fields):\n";
  output += JSON.stringify(stripImages(products[0]), null, 2) + "\n\n";
}

output += "Import Strategy:\n";
output += "1. We will use Firebase writeBatch() to group operations.\n";
output += "2. Batches will be sized at 400 operations per batch.\n";
output += "3. For each category and product, we will use setDoc(..., { merge: true })\n";
output += "   - This ensures existing documents with the same ID are updated/merged.\n";
output += "   - Fields like stock, price, descriptions will be preserved.\n";
output += "   - If the ID does not exist, it will be created with the exact ID from the backup.\n";

fs.writeFileSync('analysis.txt', output);
console.log("Analysis written to analysis.txt");
