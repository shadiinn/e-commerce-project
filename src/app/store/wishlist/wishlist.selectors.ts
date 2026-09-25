import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import { WishlistState } from './wishlist.state';

import {
  selectProductEntities
} from '../products/products.selectors';

import {
  selectIsAuthenticated
} from '../auth/auth.selectors';


// =====================================================
// WISHLIST STATE
// =====================================================

export const selectWishlistState =
  createFeatureSelector<WishlistState>(
    'wishlist'
  );


// =====================================================
// AUTHENTICATED WISHLIST ITEMS
// =====================================================

export const selectWishlistItems =
  createSelector(
    selectWishlistState,
    state => state.items
  );


// =====================================================
// GUEST WISHLIST ITEMS
// =====================================================

export const selectGuestWishlistItems =
  createSelector(
    selectWishlistState,
    state => state.guestItems
  );


// =====================================================
// AUTHENTICATED WISHLIST WITH PRODUCTS
// =====================================================

export const selectWishlistItemsWithProducts =
  createSelector(
    selectWishlistItems,
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
// GUEST WISHLIST WITH PRODUCTS
// =====================================================

export const selectGuestWishlistItemsWithProducts =
  createSelector(
    selectGuestWishlistItems,
    selectProductEntities,

    (items, products) => {

      return items
        .map(productId => {

          const product =
            products[productId];

          if (!product) {
            return null;
          }

          return {
            productId,
            product
          };

        })
        .filter(
          item => item !== null
        );

    }
  );


// =====================================================
// ACTIVE WISHLIST WITH PRODUCTS
// =====================================================

export const selectActiveWishlistItemsWithProducts =
  createSelector(
    selectIsAuthenticated,
    selectWishlistItemsWithProducts,
    selectGuestWishlistItemsWithProducts,

    (
      isAuthenticated,
      authenticatedItems,
      guestItems
    ) => {

      return isAuthenticated
        ? authenticatedItems
        : guestItems;

    }
  );


// =====================================================
// WISHLIST COUNT
// =====================================================

export const selectWishlistCount =
  createSelector(
    selectIsAuthenticated,
    selectWishlistItems,
    selectGuestWishlistItems,

    (
      isAuthenticated,
      authenticatedItems,
      guestItems
    ) => {

      return isAuthenticated
        ? authenticatedItems.length
        : guestItems.length;

    }
  );


// =====================================================
// CHECK PRODUCT IN WISHLIST
// =====================================================

export const selectIsProductInWishlist =
  (productId: string) =>

    createSelector(
      selectIsAuthenticated,
      selectWishlistItems,
      selectGuestWishlistItems,

      (
        isAuthenticated,
        authenticatedItems,
        guestItems
      ) => {

        if (isAuthenticated) {

          return authenticatedItems.some(
            item =>
              item.productId === productId
          );

        }

        return guestItems.includes(
          productId
        );

      }
    );


// =====================================================
// LOADING
// =====================================================

export const selectWishlistLoading =
  createSelector(
    selectWishlistState,
    state => state.loading
  );


// =====================================================
// ERROR
// =====================================================

export const selectWishlistError =
  createSelector(
    selectWishlistState,
    state => state.error
  );