export type Product = {
  id: string;
  name: string;
  nameEn?: string;
  nameHi?: string;
  brand?: string;
  category: string;
  categoryId?: string;
  subcategory?: string;
  variant?: string;
  unit?: string;
  attributes?: Record<string, string>;
  price: number;
  mrp?: number;
  image: string;
  isActive: boolean;
  isAvailable: boolean;
  isBestseller?: boolean;

  manualSearchAliases: string[];
  aiSearchAliases: string[];
  searchStatus: "pending" | "processing" | "ready" | "failed";
  searchError: string | null;
  searchErrorAt: number | null;
  processingAttempts: number;
  processingStartedAt: number | null;
  processingJobId: string | null;
  lastProcessedAt: number | null;
  productVersion: number;
};

export type Category = {
  id: string;
  nameEn: string;
  nameHi?: string;
  imageUrl?: string;
  emoji?: string;
  isActive: boolean;
  order: number;
  description?: string;
};

export type CartItem = { id: string; quantity: number };

export interface ProductRecommendation {
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
}
