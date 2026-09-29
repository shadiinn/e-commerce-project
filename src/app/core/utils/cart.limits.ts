import { Product } from '../models/product.model';

import { CART_LIMITS } from '../models/constants/cart.constants';


// =====================================================
// RESULT OF A QUANTITY CHECK
// =====================================================

export type QuantityLimit =
  | 'OK'
  | 'MAX_QUANTITY'
  | 'STOCK_LIMIT'
  | 'OUT_OF_STOCK';


// =====================================================
// STOCK OF ONE PRODUCT + COLOR + SIZE
// =====================================================

export function getSizeStock(
  product: Product | undefined,
  variantId: string,
  size: string
): number {

  return (
    product
      ?.variants
      .find(variant => variant.id === variantId)
      ?.sizes
      .find(item => item.size === size)
      ?.stock ?? 0
  );

}


// =====================================================
// MAX QUANTITY ALLOWED FOR ONE CART ITEM
// = smaller of the per-item limit and the stock
// =====================================================

export function getMaxQuantity(
  stock: number
): number {

  return Math.max(
    0,
    Math.min(
      CART_LIMITS.MAX_QUANTITY_PER_ITEM,
      stock
    )
  );

}


// =====================================================
// CAN ONE MORE UNIT BE ADDED TO THIS CART ITEM?
// =====================================================

export function checkQuantityLimit(
  currentQuantity: number,
  stock: number
): QuantityLimit {

  if (stock <= 0) {

    return 'OUT_OF_STOCK';

  }


  if (
    currentQuantity <
    getMaxQuantity(stock)
  ) {

    return 'OK';

  }


  // Stock is the reason we stopped (less than the per-item limit)
  return stock <
    CART_LIMITS.MAX_QUANTITY_PER_ITEM

    ? 'STOCK_LIMIT'

    : 'MAX_QUANTITY';

}


// =====================================================
// MESSAGES
// =====================================================

// Longer text for toasts
export function quantityLimitMessage(
  limit: QuantityLimit,
  stock: number
): string {

  switch (limit) {

    case 'MAX_QUANTITY':

      return (
        `Limit reached: you can add up to ` +
        `${CART_LIMITS.MAX_QUANTITY_PER_ITEM} ` +
        `of the same item (same color and size).`
      );

    case 'STOCK_LIMIT':

      return (
        `Only ${stock} ` +
        `${stock === 1 ? 'is' : 'are'} ` +
        `available in this size, and all ` +
        `${stock === 1 ? 'is' : 'are'} ` +
        `already in your cart.`
      );

    case 'OUT_OF_STOCK':

      return 'This size is currently out of stock.';

    default:

      return '';

  }

}


// Short text shown next to the quantity on the cart page
export function quantityLimitNote(
  limit: QuantityLimit,
  stock: number
): string {

  switch (limit) {

    case 'MAX_QUANTITY':

      return (
        `Maximum ` +
        `${CART_LIMITS.MAX_QUANTITY_PER_ITEM} ` +
        `per item reached`
      );

    case 'STOCK_LIMIT':

      return `Only ${stock} in stock`;

    case 'OUT_OF_STOCK':

      return 'Out of stock';

    default:

      return '';

  }

}


export function distinctProductLimitMessage(): string {

  return (
    `Your cart can hold up to ` +
    `${CART_LIMITS.MAX_DISTINCT_PRODUCTS} ` +
    `different products. Remove one to add another.`
  );

}


// =====================================================
// CAN THIS PRODUCT + COLOR + SIZE BE ADDED TO THE CART?
// Used before dispatching "add to cart" and again inside
// the effects, so both always follow the same rules.
// =====================================================

export interface AddToCartCheck {

  allowed: boolean;

  message: string;

}


interface CartLine {

  productId: string;

  variantId: string;

  size: string;

  quantity: number;

}


export function evaluateAddToCart(
  cartItems: CartLine[],
  productId: string,
  variantId: string,
  size: string,
  stock: number
): AddToCartCheck {

  const existingItem =
    cartItems.find(
      item =>
        item.productId === productId &&
        item.variantId === variantId &&
        item.size === size
    );


  // -----------------------------------------------------
  // ITEM ALREADY IN CART -> limit applies to THIS item only
  // (another size / color of the same product has its own limit)
  // -----------------------------------------------------

  if (existingItem) {

    const limit =
      checkQuantityLimit(
        existingItem.quantity,
        stock
      );

    return limit === 'OK'

      ? { allowed: true, message: '' }

      : {
          allowed: false,
          message:
            quantityLimitMessage(limit, stock)
        };

  }


  // -----------------------------------------------------
  // NEW CART ITEM
  // -----------------------------------------------------

  if (stock <= 0) {

    return {
      allowed: false,
      message:
        quantityLimitMessage(
          'OUT_OF_STOCK',
          stock
        )
    };

  }


  // Only a brand-new PRODUCT counts towards the distinct
  // product limit. A different size / color of a product that
  // is already in the cart does not.
  const distinctProducts =
    new Set(
      cartItems.map(
        item => item.productId
      )
    );


  if (
    !distinctProducts.has(productId) &&
    distinctProducts.size >=
    CART_LIMITS.MAX_DISTINCT_PRODUCTS
  ) {

    return {
      allowed: false,
      message:
        distinctProductLimitMessage()
    };

  }


  return { allowed: true, message: '' };

}


export const CART_MERGE_TRIMMED_MESSAGE =
  'Some items from your guest cart were not fully added because of cart limits.';