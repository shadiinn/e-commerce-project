import { createAction, props } from '@ngrx/store';

import { Product } from '../../core/models/product.model';

import { CartItem } from '../../core/models/cart.model';

import { GuestCartItem } from '../../core/models/guest-cart.model';


// =====================================================
// LOGGED-IN CART
// =====================================================

export const addToCart = createAction(

  '[Cart] Add To Cart',

  props<{

    product: Product;

    variantId: string;

    size: string;

  }>()

);


export const increaseQuantity = createAction(

  '[Cart] Increase Quantity',

  props<{

    cartItemId: string;

  }>()

);


export const decreaseQuantity = createAction(

  '[Cart] Decrease Quantity',

  props<{

    cartItemId: string;

  }>()

);


export const removeFromCart = createAction(

  '[Cart] Remove From Cart',

  props<{

    cartItemId: string;

  }>()

);


export const clearCart = createAction(

  '[Cart] Clear Cart'

);


export const loadCart = createAction(

  '[Cart] Load Cart'

);


export const loadCartSuccess = createAction(

  '[Cart] Load Cart Success',

  props<{

    items: CartItem[];

  }>()

);


export const loadCartFailure = createAction(

  '[Cart] Load Cart Failure',

  props<{

    error: string;

  }>()

);


export const resetCart = createAction(

  '[Cart] Reset Cart'

);


// =====================================================
// GUEST CART
// =====================================================

export const loadGuestCart = createAction(

  '[Cart] Load Guest Cart'

);


export const loadGuestCartSuccess = createAction(

  '[Cart] Load Guest Cart Success',

  props<{

    items: GuestCartItem[];

  }>()

);


export const addGuestCartItem = createAction(

  '[Cart] Add Guest Cart Item',

  props<{

    productId: string;

    variantId: string;

    size: string;

  }>()

);


export const increaseGuestQuantity = createAction(

  '[Cart] Increase Guest Quantity',

  props<{

    cartItemId: string;

  }>()

);


export const decreaseGuestQuantity = createAction(

  '[Cart] Decrease Guest Quantity',

  props<{

    cartItemId: string;

  }>()

);


export const removeGuestItem = createAction(

  '[Cart] Remove Guest Item',

  props<{

    cartItemId: string;

  }>()

);


export const clearGuestCart = createAction(

  '[Cart] Clear Guest Cart'

);


// =====================================================
// MERGE GUEST CART
// =====================================================

export const mergeGuestCart = createAction(

  '[Cart] Merge Guest Cart',

  props<{

    returnUrl?: string;

  }>()

);


export const mergeGuestCartSuccess = createAction(

  '[Cart] Merge Guest Cart Success',

  props<{

    returnUrl?: string;

  }>()

);


export const mergeGuestCartFailure = createAction(

  '[Cart] Merge Guest Cart Failure',

  props<{

    error: string;

    returnUrl?: string;

  }>()

);
