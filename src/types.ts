export interface Product {
  id: string;
  title: string;
  sku: string;
  qty: number;
  category: string;
  status: string;
  material: string;
  moq: number;
  image: string;
  images?: string[];
  featured: boolean;
  addedAt: string;
  productType?: 'stock' | 'fresh';
}

export interface Inquiry {
  id: string;
  fullName: string;
  email: string;
  company: string;
  categories: string[];
  message: string;
  productTitle?: string;
  productSku?: string;
  createdAt: string;
}

export interface Stats {
  totalProducts: number;
  totalVolume: number;
  categoryCount: number;
  totalInquiries: number;
}

export const CATEGORIES = [
  "Women",
  "Men"
];

export const FRESH_CATEGORIES = [
  "T-Shirt",
  "Polo Shirt",
  "Tank Top",
  "Leggings",
  "Pant",
  "Jogger",
  "Hoodie",
  "Boxer",
  "Shirt",
  "Denim Pant",
  "Denim Shirt"
];
