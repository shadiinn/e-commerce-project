import { createReducer, on } from '@ngrx/store';

import {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  loadCart,
  loadCartSuccess,
  loadCartFailure,
  resetCart
} from './cart.actions';

import {
  initialCartState
} from './cart.state';


export const cartReducer = createReducer(

  initialCartState,


  // =====================================================
  // LOAD CART
  // =====================================================

  on(
    loadCart,
    state => ({
      ...state,
      loading: true,
      error: null
    })
  ),


  // =====================================================
  // LOAD CART SUCCESS
  // =====================================================

  on(
    loadCartSuccess,
    (state, { items }) => ({
      ...state,
      items,
      loading: false,
      error: null
    })
  ),


  // =====================================================
  // LOAD CART FAILURE
  // =====================================================

  on(
    loadCartFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error
    })
  ),


  // =====================================================
  // ADD TO CART
  // =====================================================

  /*
   * Backend persistence is handled by CartEffects.
   *
   * The effect:
   * 1. Gets the authenticated user
   * 2. Gets that user's cart
   * 3. Checks for the same product/size/color
   * 4. Updates the existing item OR creates a new item
   * 5. Reloads the user's cart
   *
   * Therefore the reducer does not modify the state here.
   */

  on(
    addToCart,
    state => state
  ),


  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  on(
    increaseQuantity,
    (state, { cartItemId }) => ({
      ...state,

      items: state.items.map(item =>
        item.id === cartItemId
          ? {
              ...item,
              quantity: item.quantity + 1
            }
          : item
      )
    })
  ),


  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  on(
    decreaseQuantity,
    (state, { cartItemId }) => ({
      ...state,

      items: state.items
        .map(item =>
          item.id === cartItemId
            ? {
                ...item,
                quantity: item.quantity - 1
              }
            : item
        )
        .filter(item => item.quantity > 0)
    })
  ),


  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  on(
    removeFromCart,
    (state, { cartItemId }) => ({
      ...state,

      items: state.items.filter(
        item => item.id !== cartItemId
      )
    })
  ),


  // =====================================================
  // CLEAR CART
  // =====================================================

  on(
    clearCart,
    state => ({
      ...state,
      items: [],
      error: null
    })
  ),

  on(
    resetCart,
    state => ({
      ...state,
      items: [],
      loading: false,
      error: null
    })
  ),

);