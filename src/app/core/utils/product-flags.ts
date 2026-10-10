import { Product } from '../models/product.model';

// A product is a new arrival for 30 days after it was added.
export function isNewProduct(product: Product, now = new Date()): boolean {
  if (!product.createdAt) return false;
  const createdAt = new Date(product.createdAt);
  if (Number.isNaN(createdAt.getTime())) return false;
  const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return ageInDays >= 0 && ageInDays <= 30;
}

// Homepage featured products are chosen from customer ratings, not an admin checkbox.
export function isFeaturedProduct(product: Product): boolean {
  return product.rating >= 4.5 && product.reviewsCount >= 10;
}
