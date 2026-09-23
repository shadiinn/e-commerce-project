import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import { WishlistState } from './wishlist.state';

import {
  selectProductEntities
} from '../products/products.selectors';


// =====================================================
// WISHLIST STATE
// =====================================================

export const selectWishlistState =
  createFeatureSelector<WishlistState>(
    'wishlist'
  );


// =====================================================
// WISHLIST ITEMS
// =====================================================

export const selectWishlistItems =
  createSelector(
    selectWishlistState,
    state => state.items
  );


// =====================================================
// WISHLIST ITEMS WITH PRODUCTS
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
// WISHLIST COUNT
// =====================================================

export const selectWishlistCount =
  createSelector(
    selectWishlistItems,
    items => items.length
  );


// =====================================================
// CHECK PRODUCT IN WISHLIST
// =====================================================

export const selectIsProductInWishlist =
  (productId: string) =>
    createSelector(
      selectWishlistItems,

      items =>
        items.some(
          item =>
            item.productId === productId
        )
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