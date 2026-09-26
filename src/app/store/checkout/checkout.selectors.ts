import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import {
  CheckoutState
} from './checkout.state';

import {
  selectProductEntities
} from '../products/products.selectors';


export const selectCheckoutState =
  createFeatureSelector<CheckoutState>(
    'checkout'
  );


export const selectCheckoutMode =
  createSelector(
    selectCheckoutState,
    state => state.mode
  );


export const selectCheckoutItems =
  createSelector(
    selectCheckoutState,
    state => state.items
  );


export const selectCheckoutItemsWithProducts =
  createSelector(

    selectCheckoutItems,

    selectProductEntities,

    (items, products) => {

      return items

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
          item =>
            item !== null
        );

    }

  );


export const selectCheckoutSubtotal =
  createSelector(

    selectCheckoutItems,

    selectProductEntities,

    (items, products) => {

      return items.reduce(

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

      );

    }

  );


// =====================================================
// CHECKOUT ACTIVE
// =====================================================

export const selectIsCheckoutActive =
  createSelector(

    selectCheckoutState,

    state =>

      state.mode !== null &&

      state.items.length > 0

  );
