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