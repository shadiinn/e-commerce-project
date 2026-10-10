import { isFeaturedProduct } from '../../core/utils/product-flags';
import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import {
  productsAdapter,
  ProductsState
} from './products.state';


export const selectProductsState =
  createFeatureSelector<ProductsState>('products');


const {
  selectAll,
  selectEntities,
  selectIds,
  selectTotal
} = productsAdapter.getSelectors(
  selectProductsState
);


export const selectAllProducts =
  selectAll;


export const selectProductEntities =
  selectEntities;


export const selectProductIds =
  selectIds;


export const selectProductTotal =
  selectTotal;


export const selectProductsLoading =createSelector(
    selectProductsState,
    state => state.loading
  );


export const selectProductsError =createSelector(
    selectProductsState,
    state => state.error
  );

export const selectProductById =
  (id: string) =>
    createSelector(
      selectProductEntities,
      entities => entities[id]
    );

export const selectProductsByCategory =
  (category: string) =>
    createSelector(
      selectAllProducts,
      products =>
        products.filter(
          product => product.category === category
        )
    );

// Featured products are selected automatically from their rating and review count.
// This keeps the home-page selection independent of manual admin flags.
export const selectFeaturedProducts =
  createSelector(
    selectAllProducts,
    products =>
      products
        .filter(product => isFeaturedProduct(product))
        .sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount)
        .slice(0, 8)
  );

// Same category, current product excluded — used for the
// "Similar Products" section on the product details page.
export const selectSimilarProducts =
  (category: string, excludeProductId: string) =>
    createSelector(
      selectAllProducts,
      products =>
        products.filter(
          product =>
            product.category === category &&
            product.id !== excludeProductId
        )
    );