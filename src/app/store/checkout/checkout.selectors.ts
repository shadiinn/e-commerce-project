import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import { CheckoutState } from './checkout.state';

import {
  selectProductEntities
} from '../products/products.selectors';


// =====================================================
// CHECKOUT STATE
// =====================================================

export const selectCheckoutState =
  createFeatureSelector<CheckoutState>(
    'checkout'
  );


// =====================================================
// CHECKOUT MODE
// =====================================================

export const selectCheckoutMode =
  createSelector(
    selectCheckoutState,
    state => state.mode
  );


// =====================================================
// CHECKOUT ITEMS
// =====================================================

export const selectCheckoutItems =
  createSelector(
    selectCheckoutState,
    state => state.items
  );


// =====================================================
// CHECKOUT ITEMS WITH PRODUCTS
// =====================================================

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

          return {
            ...item,
            product
          };

        })
        .filter(
          item => item !== null
        );

    }
  );


// =====================================================
// CHECKOUT SUBTOTAL
// =====================================================

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

          return total +
            product.price * item.quantity;

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