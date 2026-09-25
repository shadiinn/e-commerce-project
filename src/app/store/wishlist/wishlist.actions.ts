import { createAction, props } from '@ngrx/store';

import { Product } from '../../core/models/product.model';

import { WishlistItem } from '../../core/models/wishlist.model';


// =====================================================
// LOAD WISHLIST
// =====================================================

export const loadWishlist =
  createAction(
    '[Wishlist] Load Wishlist'
  );


// =====================================================
// LOAD WISHLIST SUCCESS
// =====================================================

export const loadWishlistSuccess =
  createAction(
    '[Wishlist] Load Wishlist Success',
    props<{
      items: WishlistItem[];
    }>()
  );


// =====================================================
// LOAD WISHLIST FAILURE
// =====================================================

export const loadWishlistFailure =
  createAction(
    '[Wishlist] Load Wishlist Failure',
    props<{
      error: string;
    }>()
  );


// =====================================================
// TOGGLE WISHLIST
// =====================================================

export const toggleWishlist =
  createAction(
    '[Wishlist] Toggle Wishlist',
    props<{
      product: Product;
    }>()
  );


// =====================================================
// CLEAR WISHLIST
// =====================================================

export const clearWishlist =
  createAction(
    '[Wishlist] Clear Wishlist'
  );


// =====================================================
// RESET WISHLIST
// =====================================================

export const resetWishlist =
  createAction(
    '[Wishlist] Reset Wishlist'
  );

  // =====================================================
// GUEST WISHLIST
// =====================================================

export const loadGuestWishlist = createAction(
  '[Wishlist] Load Guest Wishlist'
);

export const loadGuestWishlistSuccess = createAction(
  '[Wishlist] Load Guest Wishlist Success',
  props<{
    items: string[];
  }>()
);

export const addGuestWishlistItem = createAction(
  '[Wishlist] Add Guest Wishlist Item',
  props<{
    productId: string;
  }>()
);

export const removeGuestWishlistItem = createAction(
  '[Wishlist] Remove Guest Wishlist Item',
  props<{
    productId: string;
  }>()
);

export const clearGuestWishlist = createAction(
  '[Wishlist] Clear Guest Wishlist'
);

export const mergeGuestWishlist = createAction(
  '[Wishlist] Merge Guest Wishlist',
  props<{ returnUrl?: string }>()
);

export const mergeGuestWishlistSuccess = createAction(
  '[Wishlist] Merge Guest Wishlist Success',
  props<{ returnUrl?: string }>()
);

export const mergeGuestWishlistFailure = createAction(
  '[Wishlist] Merge Guest Wishlist Failure',
  props<{
    error: string;
    returnUrl?: string;
  }>()
);