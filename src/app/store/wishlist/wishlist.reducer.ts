import { createReducer, on } from '@ngrx/store';

import {
  loadWishlist,
  loadWishlistSuccess,
  loadWishlistFailure,
  toggleWishlist,
  clearWishlist,
  resetWishlist,

  loadGuestWishlistSuccess,
  addGuestWishlistItem,
  removeGuestWishlistItem,
  clearGuestWishlist

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
  // CLEAR AUTHENTICATED WISHLIST
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
  ),


  // =====================================================
  // LOAD GUEST WISHLIST SUCCESS
  // =====================================================

  on(
    loadGuestWishlistSuccess,

    (state, { items }) => ({
      ...state,
      guestItems: items,
      error: null
    })
  ),


  // =====================================================
  // ADD GUEST WISHLIST ITEM
  // =====================================================

  on(
    addGuestWishlistItem,

    (state, { productId }) => {

      // Prevent duplicate products
      if (state.guestItems.includes(productId)) {
        return state;
      }

      return {
        ...state,

        guestItems: [
          ...state.guestItems,
          productId
        ]
      };

    }
  ),


  // =====================================================
  // REMOVE GUEST WISHLIST ITEM
  // =====================================================

  on(
    removeGuestWishlistItem,

    (state, { productId }) => ({
      ...state,

      guestItems:
        state.guestItems.filter(
          id => id !== productId
        )
    })
  ),


  // =====================================================
  // CLEAR GUEST WISHLIST
  // =====================================================

  on(
    clearGuestWishlist,

    state => ({
      ...state,

      guestItems: []
    })
  )

);