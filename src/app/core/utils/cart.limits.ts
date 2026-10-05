import { Product } from '../models/product.model';
import { CART_LIMITS } from '../models/constants/cart.constants';


   export const MAX_PER_ITEM=5;
   export const MAX_DIFFERENT_PRODUCTS=10;


export type QuantityLimit = 'OK' | 'MAX_QUANTITY' | 'STOCK_LIMIT' | 'OUT_OF_STOCK';


export interface CartLine {
  productId: string;
  variantId: string; 
  size: string;
  quantity: number;
}


export interface AddToCartCheck {
  allowed: boolean;
  message: string;     
}

export function getSizeStock(
  product: Product | undefined,
  variantId: string | undefined,
  size: string | undefined
): number {
  const colour = product?.variants.find(v => v.id === variantId);
  const sizeInfo = colour?.sizes.find(s => s.size === size);
  return sizeInfo?.stock ?? 0;
}

export function getMaxQuantity(stock: number): number {
  return Math.max(0, Math.min(MAX_PER_ITEM, stock));
}



export function checkQuantityLimit(currentQuantity: number, stock: number): QuantityLimit {
  if (stock <= 0) {
    return 'OUT_OF_STOCK';
  }

  if (currentQuantity < getMaxQuantity(stock)) {
    return 'OK';
  }

  if (stock < MAX_PER_ITEM) {
    return 'STOCK_LIMIT';
  }

  return 'MAX_QUANTITY';
}


export function quantityLimitMessage(limit: QuantityLimit, stock: number): string {
  if (limit === 'OUT_OF_STOCK') {
    return 'This size is currently out of stock.';
  }

  if (limit === 'STOCK_LIMIT') {
    return stock === 1
      ? 'Only 1 is available in this size and it is already in your cart.'
      : `Only ${stock} are available in this size and all of them are already in your cart.`;
  }

  if (limit === 'MAX_QUANTITY') {
    return `You can add up to ${MAX_PER_ITEM} of the same item.`;
  }

  return '';   
}

export function quantityLimitNote(limit: QuantityLimit, stock: number): string {
  if (limit === 'OUT_OF_STOCK') {
    return 'Out of stock';
  }

  if (limit === 'STOCK_LIMIT') {
    return `Only ${stock} in stock`;
  }

  if (limit === 'MAX_QUANTITY') {
    return `Maximum ${MAX_PER_ITEM} per item`;
  }

  return '';
}

export function distinctProductLimitMessage(): string {
  return `Your cart can hold up to ${MAX_DIFFERENT_PRODUCTS} different products. Remove one to add another.`;
}

// Shown after the guest cart is merged into the account cart and something was reduced or skipped
export const CART_MERGE_TRIMMED_MESSAGE =
  'Some items from your guest cart were reduced or skipped because of stock or cart limits.';



export function findCartLine<T extends CartLine>(
  cartItems: T[],
  productId: string,
  variantId: string,
  size: string
): T | undefined {
  return cartItems.find(
    item =>
      item.productId === productId &&
      item.variantId === variantId &&
      item.size === size
  );
}


export function isOverProductLimit(cartItems: { productId: string }[], productId: string): boolean {
 
  const differentProducts = new Set(cartItems.map(item => item.productId));

  const alreadyInCart = differentProducts.has(productId);
  const cartIsFull = differentProducts.size >= MAX_DIFFERENT_PRODUCTS;

  return !alreadyInCart && cartIsFull;
}


export function evaluateAddToCart(
  cartItems: CartLine[],
  productId: string,
  variantId: string,
  size: string,
  stock: number
): AddToCartCheck {

  const existingRow = findCartLine(cartItems, productId, variantId, size);

  // CASE A: the item is already in the cart -> only the quantity rules matter
  if (existingRow) {
    const limit = checkQuantityLimit(existingRow.quantity, stock);

    if (limit === 'OK') {
      return { allowed: true, message: '' };
    }
    return { allowed: false, message: quantityLimitMessage(limit, stock) };
  }

  // CASE B: a new item. Check 1: is there any stock?
  if (stock <= 0) {
    return { allowed: false, message: quantityLimitMessage('OUT_OF_STOCK', stock) };
  }

  // CASE B. Check 2: is there room for one more different product?
  if (isOverProductLimit(cartItems, productId)) {
    return { allowed: false, message: distinctProductLimitMessage() };
  }

  return { allowed: true, message: '' };
}