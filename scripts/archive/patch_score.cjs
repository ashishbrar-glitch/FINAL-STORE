const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldScoreFn = /function scoreRecommendation\([^}]+\}\): number \{[\s\S]*?return score;\n\}/;

const newScoreFn = `const RECOMMENDATION_WEIGHTS = {
  complementary: 100,
  similar: 50,
  categoryFit: 10,
  priority: 0.2,
  bestsellerBoost: 5,
  priceFit: 5,
  confidence: 2,
};

function scoreRecommendation(
  candidate: Product,
  sourceProduct: Product,
  rel: ProductRecommendation
): number {
  let score = 0;
  
  if (rel.type === "complementary") score += RECOMMENDATION_WEIGHTS.complementary;
  else if (rel.type === "similar") score += RECOMMENDATION_WEIGHTS.similar;
  
  score += (rel.categoryFit ?? (candidate.category === sourceProduct.category ? 1 : 0)) * RECOMMENDATION_WEIGHTS.categoryFit;
  score += (rel.priority || 0) * RECOMMENDATION_WEIGHTS.priority;
  score += (rel.bestsellerBoost ?? (candidate.isBestseller ? 1 : 0)) * RECOMMENDATION_WEIGHTS.bestsellerBoost;
  
  const defaultPriceFit = sourceProduct.price > 0 && candidate.price > 0
    ? 1 - Math.min((Math.max(sourceProduct.price, candidate.price) / Math.min(sourceProduct.price, candidate.price) - 1), 1)
    : 0.5;
  score += (rel.priceFit ?? defaultPriceFit) * RECOMMENDATION_WEIGHTS.priceFit;
  
  score += (rel.confidence || 0) * RECOMMENDATION_WEIGHTS.confidence;
  
  return score;
}`;

code = code.replace(oldScoreFn, newScoreFn);

const oldSort = /\/\/ Sort: complementary > similar, then by priority, then by confidence[\s\S]*?\}\);/s;

const newSort = `// Rank candidates using the score function
       results.sort((a, b) => scoreRecommendation(b.product, sourceProduct, b.rel) - scoreRecommendation(a.product, sourceProduct, a.rel));`;

code = code.replace(oldSort, newSort);
fs.writeFileSync('src/App.tsx', code);
