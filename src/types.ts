export type Product = {
  id: string;
  name: string;
  nameHi?: string;
  price: number;
  mrp?: number;
  category: string;
  image: string;
  popular?: boolean;
};

export type Category = {
  id: string;
  nameEn: string;
  nameHi?: string;
  imageUrl?: string;
  emoji?: string;
  isActive: boolean;
  order: number;
};

export type CartItem = { id: string; quantity: number };
