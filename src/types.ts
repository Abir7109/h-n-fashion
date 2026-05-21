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
  featured: boolean;
  addedAt: string;
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
