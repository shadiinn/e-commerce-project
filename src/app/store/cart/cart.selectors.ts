import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import { CartState } from './cart.state';

import {
  selectProductEntities
} from '../products/products.selectors';

import {
  selectIsAuthenticated
} from '../auth/auth.selectors';


export const selectCartState =
  createFeatureSelector<CartState>(
    'cart'
  );


export const selectCartItems =
  createSelector(
    selectCartState,
    state => state.items
  );


export const selectActiveCartItems =
  createSelector(

    selectCartState,

    selectIsAuthenticated,

    (state, isAuthenticated) => {

      if (isAuthenticated) {

        return state.items;

      }

      return state.guestItems;

    }

  );


export const selectCartItemsWithProducts =
  createSelector(

    selectActiveCartItems,

    selectProductEntities,

    (items, products) =>

      items

        .map(item => {

          const product =
            products[item.productId];

          if (!product) {

            return null;

          }


          const variant =
            product.variants.find(
              variant =>
                variant.id ===
                item.variantId
            );

          if (!variant) {

            return null;

          }


          return {

            ...item,

            product,

            variant

          };

        })

        .filter(
          item => item !== null
        )

  );


export const selectCartItemCount =
  createSelector(

    selectActiveCartItems,

    items =>

      items.reduce(

        (total, item) =>
          total + item.quantity,

        0

      )

  );


export const selectCartSubtotal =
  createSelector(

    selectActiveCartItems,

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

            product.price *

            item.quantity

          );

        },

        0

      )

  );
