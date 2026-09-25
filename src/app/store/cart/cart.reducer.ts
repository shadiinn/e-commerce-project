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
        .filter(
          item => item.quantity > 0
        )

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


  // =====================================================
  // RESET CART
  // =====================================================

  on(
    resetCart,

    state => ({

      ...state,

      items: [],

      loading: false,

      error: null

    })
  ),


  // =====================================================
  // LOAD GUEST CART SUCCESS
  // =====================================================

  on(
    loadGuestCartSuccess,

    (state, { items }) => ({

      ...state,

      guestItems: items,

      error: null

    })
  ),


  // =====================================================
  // ADD GUEST CART ITEM
  // =====================================================

  on(
    addGuestCartItem,

    (state, { productId, size }) => {

      const cartItemId =
        `${productId}-${size}`;


      const existingItem =
        state.guestItems.find(
          item => item.id === cartItemId
        );


      // -------------------------------------------------
      // EXISTING ITEM
      // -------------------------------------------------

      if (existingItem) {

        return {

          ...state,

          guestItems:
            state.guestItems.map(item =>

              item.id === cartItemId

                ? {
                    ...item,

                    quantity:
                      item.quantity + 1
                  }

                : item

            )

        };

      }


      // -------------------------------------------------
      // NEW ITEM
      // -------------------------------------------------

      return {

        ...state,

        guestItems: [

          ...state.guestItems,

          {

            id: cartItemId,

            productId,

            size,

            quantity: 1

          }

        ]

      };

    }

  ),


  // =====================================================
  // INCREASE GUEST QUANTITY
  // =====================================================

  on(
    increaseGuestQuantity,

    (state, { cartItemId }) => ({

      ...state,

      guestItems:

        state.guestItems.map(item =>

          item.id === cartItemId

            ? {

                ...item,

                quantity:
                  item.quantity + 1

              }

            : item

        )

    })
  ),


  // =====================================================
  // DECREASE GUEST QUANTITY
  // =====================================================

  on(
    decreaseGuestQuantity,

    (state, { cartItemId }) => ({

      ...state,

      guestItems:

        state.guestItems
          .map(item =>

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


  // =====================================================
  // REMOVE GUEST ITEM
  // =====================================================

  on(
    removeGuestItem,

    (state, { cartItemId }) => ({

      ...state,

      guestItems:

        state.guestItems.filter(
          item => item.id !== cartItemId
        )

    })
  ),


  // =====================================================
  // CLEAR GUEST CART
  // =====================================================

  on(
    clearGuestCart,

    state => ({

      ...state,

      guestItems: [],

      error: null

    })
  )

);