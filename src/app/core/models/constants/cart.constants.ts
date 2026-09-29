export const CART_LIMITS = {

  // Maximum quantity of ONE cart item
  // (same product + same color + same size).
  // It is also capped by that size's stock.
  // Different sizes / colors of the same product
  // each get their own limit.
  MAX_QUANTITY_PER_ITEM: 5,

  // Maximum number of different products
  // in the cart. (Another size or color of a
  // product that is already in the cart does
  // not count as a new product.)
  MAX_DISTINCT_PRODUCTS: 10

};