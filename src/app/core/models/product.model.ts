export interface ProductSize {
  size: string;
  stock: number;
}

export interface ProductVariant {
  id: string;
  color: string;
  images: string[];
  sizes: ProductSize[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  oldPrice?: number;
  description: string;
  variants: ProductVariant[];
  rating: number;
  reviewsCount: number;
  isNew: boolean;
  isFeatured: boolean;
}