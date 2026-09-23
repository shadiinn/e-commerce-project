import { createReducer, on } from '@ngrx/store';

import {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  loadCart,
  loadCartSuccess,
  loadCartFailure
} from './cart.actions';

import {
  CartState,
  initialCartState
} from './cart.state';
import { CartItem } from '../../core/models/cart.model';


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
    (state, { product, size, color }) => {

        const existingItem =
        state.items.find(
            item =>
            item.productId === product.id &&
            item.size === size &&
            item.color === color
        );


        // ===============================================
        // EXISTING ITEM
        // ===============================================

        if (existingItem) {

        return {

            ...state,

            items: state.items.map(item =>

            item.id === existingItem.id

                ? {
                    ...item,
                    quantity:
                    item.quantity + 1
                }

                : item

            )

        };

        }


        // ===============================================
        // NEW ITEM
        // ===============================================

        const newCartItem: CartItem = {

        productId: product.id,

        size,

        color,

        quantity: 1

        };


        return {

        ...state,

        items: [

            ...state.items,

            newCartItem

        ]

        };

    }
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

              quantity:
                item.quantity + 1

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

      items: []

    })
  )

);