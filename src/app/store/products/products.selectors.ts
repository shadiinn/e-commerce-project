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