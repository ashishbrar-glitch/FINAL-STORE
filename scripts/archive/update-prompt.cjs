const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `Analyze the entire current product and category catalog to find logical cross-selling relationships and commonly purchased-together items.
Find both same-category and cross-category complementary products.
Prioritize meaningful complementary products (items used together) over merely similar products.
Create useful multi-step shopping chains by ensuring relationships can naturally continue into another related product.
You MUST use ONLY real product IDs from the provided catalog.
Return ONLY a JSON object where the keys are product IDs, and the values are arrays of related product IDs (no limit on count).
Do NOT wrap it in markdown block quotes.\`;`;

const replacement = `Analyze the entire current product and category catalog to create an ORDERED recommendation list for every product.
For each product, decide which products should be shown immediately after it.
Put the most useful next product first, the second most useful next product second, and so on.
Consider complementary products, commonly used together products, cross-category products, and natural shopping sequences.
Do NOT simply group similar products together.
Do NOT automatically cross-link every product in the same group.
Relationships should represent "if this product is shown, these products should come next".
The order of the returned product IDs in the arrays is meaningful and must be preserved.
You MUST use ONLY real existing product IDs from the provided catalog.
Do not impose an artificial limit on the number of meaningful connections per product.
Return ONLY a JSON object where the keys are product IDs, and the values are arrays of ordered related product IDs.
Do NOT wrap it in markdown block quotes.\`;`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Success");
} else {
  console.log("Target not found!");
}
