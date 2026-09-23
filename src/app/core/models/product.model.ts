export interface Product {
  id: string;
  name: string;
  slug: string;

  category: string;

  price: number;
  oldPrice?: number;

  description: string;

  images: string[];

  sizes: string[];
  colors: string[];

  rating: number;
  reviewsCount: number;

  stock: number;

  isNew: boolean;
  isFeatured: boolean;
}