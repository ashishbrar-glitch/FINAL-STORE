const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const oldRel = `export interface RecommendationRel {
  id: string;
  type: "similar" | "complementary";
  confidence: number;
}`;

const newRel = `export interface ProductRecommendation {
  id?: string;
  sourceProductId: string;
  targetProductId: string;
  type: "similar" | "complementary";
  placement: "goes_well_with" | "similar_products";
  confidence: number;
  priority: number;
  categoryFit: number;
  priceFit: number;
  bestsellerBoost: number;
  status: "pending" | "approved" | "blocked";
  source: "ai" | "manual";
  generatedFromProductVersion?: number;
  createdAt?: number;
  updatedAt?: number;
}`;

if (!code.includes('ProductRecommendation')) {
  code = code.replace(oldRel, newRel);
  fs.writeFileSync('src/types.ts', code);
}
