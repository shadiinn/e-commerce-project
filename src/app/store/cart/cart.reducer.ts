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

import { CART_LIMITS } from '../../core/models/constants/cart.constants';


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

  // The actual persistence is handled by the effect.
  on(
    addToCart,

    state => state

  ),


  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  on(
    increaseQuantity,

    (state, { cartItemId }) => {

      const item =
        state.items.find(
          item =>
            item.id === cartItemId
        );

      if (!item) {

        return state;

      }


      // -----------------------------------------------
      // MAX UNITS OF THIS CART ITEM
      // (same product + color + size). The stock check
      // and the user message are handled in the effect.
      // -----------------------------------------------

      if (
        item.quantity >=
        CART_LIMITS.MAX_QUANTITY_PER_ITEM
      ) {

        return state;

      }


      return {

        ...state,

        items:

          state.items.map(cartItem =>

            cartItem.id === cartItemId

              ? {

                  ...cartItem,

                  quantity:
                    cartItem.quantity + 1

                }

              : cartItem

          )

      };

    }

  ),


  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  on(
    decreaseQuantity,

    (state, { cartItemId }) => ({

      ...state,

      items:

        state.items

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
            item =>
              item.quantity > 0
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

      items:

        state.items.filter(
          item =>
            item.id !== cartItemId
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

    (state, {
      productId,
      variantId,
      size
    }) => {

      const cartItemId =
        `${productId}-${variantId}-${size}`;


      const existingItem =
        state.guestItems.find(
          item =>
            item.id === cartItemId
        );


      // -------------------------------------------------
      // EXISTING ITEM
      // -------------------------------------------------

      if (existingItem) {

        if (
          existingItem.quantity >=
          CART_LIMITS.MAX_QUANTITY_PER_ITEM
        ) {

          return state;

        }


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
      // MAX DISTINCT PRODUCTS
      // -------------------------------------------------

      const distinctProducts =
        new Set(
          state.guestItems.map(
            item => item.productId
          )
        );


      // Only a brand-new product counts towards the limit
      if (
        !distinctProducts.has(productId) &&
        distinctProducts.size >=
        CART_LIMITS.MAX_DISTINCT_PRODUCTS
      ) {

        return state;

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

            variantId,

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

    (state, { cartItemId }) => {

      const item =
        state.guestItems.find(
          item =>
            item.id === cartItemId
        );

      if (!item) {

        return state;

      }


      if (
        item.quantity >=
        CART_LIMITS.MAX_QUANTITY_PER_ITEM
      ) {

        return state;

      }


      return {

        ...state,

        guestItems:

          state.guestItems.map(cartItem =>

            cartItem.id === cartItemId

              ? {

                  ...cartItem,

                  quantity:
                    cartItem.quantity + 1

                }

              : cartItem

          )

      };

    }

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
            item =>
              item.quantity > 0
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
          item =>
            item.id !== cartItemId
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