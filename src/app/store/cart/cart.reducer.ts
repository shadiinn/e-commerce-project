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
  resetCart,

  loadGuestCartSuccess,
  addGuestCartItem,
  increaseGuestQuantity,
  decreaseGuestQuantity,
  removeGuestItem,
  clearGuestCart
} from './cart.actions';

import {
  initialCartState
} from './cart.state';


export const cartReducer = createReducer(

  initialCartState,
  on(
    loadCart,
    state => ({
      ...state,
      loading: true,
      error: null
    })
  ),

  on(
    loadCartSuccess,
    (state, { items }) => ({
      ...state,
      items,
      loading: false,
      error: null
    })
  ),

  on(
    loadCartFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error
    })
  ),

  on(
    addToCart,
    state => state
  ),

  on(
    increaseQuantity,
    (state, { cartItemId }) => ({
      ...state,
      items: state.items.map(item =>
        item.id === cartItemId
          ? {
              ...item,
              quantity:item.quantity + 1
            }
          : item
      )
    })
  ),

  on(
    decreaseQuantity,
    (state, { cartItemId }) => ({
      ...state,
      items: state.items.map(item =>
          item.id === cartItemId
            ? {
                ...item,
                quantity:
                  item.quantity - 1
              }
            : item
        )
        .filter(
          item => item.quantity > 0
        )

    })
  ),

  on(
    removeFromCart,
    (state, { cartItemId }) => ({
      ...state,
      items: state.items.filter(
        item =>item.id !== cartItemId
      )
    })
  ),

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

  // LOAD GUEST CART SUCCESS

  on(
    loadGuestCartSuccess,
    (state, { items }) => ({
      ...state,
      guestItems: items,
      error: null
    })
  ),

  // ADD GUEST CART ITEM
  on(
    addGuestCartItem,
    (state, { productId, size, color }) => {
      const cartItemId =`${productId}-${size}-${color}`;
      const existingItem =state.guestItems.find(
          item => item.id === cartItemId
        );

      if (existingItem) {
        return {
          ...state,
          guestItems:state.guestItems.map(item =>
              item.id === cartItemId
                ? {
                    ...item,
                    quantity:item.quantity + 1
                  }
                : item
            )
        };
      }

      // NEW ITEM

      return {
        ...state,
        guestItems: [
          ...state.guestItems,
          {
            id: cartItemId,
            productId,
            size,
            color,
            quantity: 1
          }
        ]
      };
    }
  ),

  on(
    increaseGuestQuantity,
    (state, { cartItemId }) => ({
      ...state,
      guestItems:
        state.guestItems.map(item =>
          item.id === cartItemId
            ? {
                ...item,
                quantity:item.quantity + 1
              }
            : item
        )
    })
  ),

  on(
    decreaseGuestQuantity,
    (state, { cartItemId }) => ({
      ...state,
      guestItems:state.guestItems.map(item =>
            item.id === cartItemId
              ? {
                  ...item,
                  quantity:
                    item.quantity - 1
                }
              : item
          )
          .filter(
            item =>item.quantity > 0
          )
    })
  ),

  on(
    removeGuestItem,
    (state, { cartItemId }) => ({
      ...state,
      guestItems:state.guestItems.filter(
          item =>item.id !== cartItemId
        )
    })
  ),

  on(
    clearGuestCart,
    state => ({
      ...state,
      guestItems: [],
      error: null
    })
  )

);