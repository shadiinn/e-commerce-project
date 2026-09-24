import { createAction, props } from '@ngrx/store';

import { Product } from '../../core/models/product.model';
import { CartItem } from '../../core/models/cart.model';


// =====================================================
// ADD TO CART
// =====================================================

export const addToCart = createAction(

  '[Cart] Add To Cart',

  props<{
    product: Product;
    size: string;
    color: string;
  }>()

);


// =====================================================
// INCREASE QUANTITY
// =====================================================

export const increaseQuantity = createAction(

  '[Cart] Increase Quantity',

  props<{
    cartItemId: string;
  }>()

);


// =====================================================
// DECREASE QUANTITY
// =====================================================

export const decreaseQuantity = createAction(

  '[Cart] Decrease Quantity',

  props<{
    cartItemId: string;
  }>()

);


// =====================================================
// REMOVE FROM CART
// =====================================================

export const removeFromCart = createAction(

  '[Cart] Remove From Cart',

  props<{
    cartItemId: string;
  }>()

);


// =====================================================
// CLEAR CART
// =====================================================

export const clearCart = createAction(
  '[Cart] Clear Cart'
);


// =====================================================
// LOAD CART
// =====================================================

export const loadCart = createAction(
  '[Cart] Load Cart'
);


// =====================================================
// LOAD CART SUCCESS
// =====================================================

export const loadCartSuccess = createAction(

  '[Cart] Load Cart Success',

  props<{
    items: CartItem[];
  }>()

);


// =====================================================
// LOAD CART FAILURE
// =====================================================

export const loadCartFailure = createAction(

  '[Cart] Load Cart Failure',

  props<{
    error: string;
  }>()
  
);
export const resetCart = createAction(
  '[Cart] Reset Cart'
);