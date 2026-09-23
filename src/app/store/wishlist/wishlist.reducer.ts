import { createReducer, on } from '@ngrx/store';

import {
  loadWishlist,
  loadWishlistSuccess,
  loadWishlistFailure,
  toggleWishlist,
  clearWishlist
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
    (state, { product }) => {

      const existingItem =
        state.items.find(
          item =>
            item.productId === product.id
        );


      // REMOVE

      if (existingItem) {

        return {
          ...state,

          items:
            state.items.filter(
              item =>
                item.productId !== product.id
            )
        };

      }


      // ADD

      const newItem = {
        id: product.id,
        productId: product.id
      };


      return {
        ...state,

        items: [
          ...state.items,
          newItem
        ]
      };

    }
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
  )

);