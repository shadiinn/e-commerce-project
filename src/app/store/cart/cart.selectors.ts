import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import { CartState } from './cart.state';

import {
  selectProductEntities
} from '../products/products.selectors';


// =====================================================
// CART STATE
// =====================================================

export const selectCartState =
  createFeatureSelector<CartState>('cart');


// =====================================================
// CART ITEMS
// =====================================================

export const selectCartItems = createSelector(

  selectCartState,

  state => state.items

);


// =====================================================
// CART ITEMS WITH PRODUCTS
// =====================================================

export const selectCartItemsWithProducts =
  createSelector(

    selectCartItems,

    selectProductEntities,

    (items, products) =>

      items

        .map(item => {

          const product =
            products[item.productId];

          if (!product) {
            return null;
          }

          return {

            ...item,

            product

          };

        })

        .filter(
          (
            item
          ): item is typeof item & {
            product: NonNullable<typeof item extends null ? never : any>
          } =>
            item !== null
        )

  );


// =====================================================
// CART ITEM COUNT
// =====================================================

export const selectCartItemCount =
  createSelector(

    selectCartItems,

    items =>

      items.reduce(

        (total, item) =>
          total + item.quantity,

        0

      )

  );


// =====================================================
// CART SUBTOTAL
// =====================================================

export const selectCartSubtotal =
  createSelector(

    selectCartItems,

    selectProductEntities,

    (items, products) =>

      items.reduce(

        (total, item) => {

          const product =
            products[item.productId];

          if (!product) {
            return total;
          }

          return (
            total +
            product.price * item.quantity
          );

        },

        0

      )

  );