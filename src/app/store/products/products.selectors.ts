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

// Products flagged isFeatured in the catalog, capped to a small
// set — used for the "Featured Products" carousel on the home
// page. Change the cap or the condition here if what counts as
// "featured" should change; nothing else needs to know.
export const selectFeaturedProducts =
  createSelector(
    selectAllProducts,
    products =>
      products
        .filter(product => product.isFeatured)
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