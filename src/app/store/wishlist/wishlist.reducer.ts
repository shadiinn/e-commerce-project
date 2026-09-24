import { createReducer, on } from '@ngrx/store';

import {
  loadWishlist,
  loadWishlistSuccess,
  loadWishlistFailure,
  toggleWishlist,
  clearWishlist,
  resetWishlist
} from './wishlist.actions';

import {
  WishlistState,
  initialWishlistState
} from './wishlist.state';


export const wishlistReducer = createReducer(

  initialWishlistState,


  // =====================================================
  // LOAD WISHLIST
  // =====================================================

  on(
    loadWishlist,
    state => ({
      ...state,
      loading: true,
      error: null
    })
  ),


  // =====================================================
  // LOAD SUCCESS
  // =====================================================

  on(
    loadWishlistSuccess,
    (state, { items }) => ({
      ...state,
      items,
      loading: false,
      error: null
    })
  ),


  // =====================================================
  // LOAD FAILURE
  // =====================================================

  on(
    loadWishlistFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error
    })
  ),


  // =====================================================
  // TOGGLE WISHLIST
  // =====================================================

  on(
    toggleWishlist,
    state => state
  ),


  // =====================================================
  // CLEAR WISHLIST
  // =====================================================

  on(
    clearWishlist,
    state => ({
      ...state,
      items: []
    })
  ),


  // =====================================================
  // RESET WISHLIST
  // =====================================================

  on(
    resetWishlist,
    state => ({
      ...state,
      items: [],
      loading: false,
      error: null
    })
  )

);