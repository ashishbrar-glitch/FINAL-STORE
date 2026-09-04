const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `Analyze the entire current product and category catalog to create an ORDERED recommendation list for every product.
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

const replacement = `Analyze the COMPLETE current product and category catalog.
For every product, independently decide which other available products should be shown immediately after it to create an ORDERED "what should appear next" list.
The recommendations must be based on complementary shopping needs, products commonly useful together, cross-category shopping relationships, natural shopping journeys, and the actual available catalog.
Do NOT create simple product groups.
Do NOT make every product in a group point to every other product.
Do NOT require relationships to be bidirectional.
Do NOT assume similar products are automatically useful together.
Do NOT hard-code product relationships.
Do NOT limit the number of meaningful recommendations.
The returned array order is critical: position 1 = best product to show next, position 2 = second best, and so on.
Each recommendation must use an existing product ID from the current catalog.
A product can recommend products from completely different categories when you determine they are useful together.
The saved relations must represent: "WHEN THIS PRODUCT IS SHOWN, THESE PRODUCTS SHOULD BE SHOWN NEXT IN THIS ORDER."
Return ONLY a JSON object where the keys are product IDs, and the values are arrays of ordered related product IDs.
Do NOT wrap it in markdown block quotes.\`;`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Success");
} else {
  console.log("Target not found!");
}
