import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import {
  productsAdapter,
  ProductsState
} from './products.state';

import { Product } from '../../core/models/product.model';

export const selectProductsState =
  createFeatureSelector<ProductsState>('products');

const {
  selectAll,
  selectEntities,
  selectIds,
  selectTotal
} = productsAdapter.getSelectors(selectProductsState);

export const selectAllProducts = selectAll;
export const selectProductEntities = selectEntities;
export const selectProductIds = selectIds;
export const selectProductTotal = selectTotal;

export const selectProductsLoading = createSelector(
  selectProductsState,
  state => state.loading
);

export const selectProductsError = createSelector(
  selectProductsState,
  state => state.error
);

export const selectProductById = (id: string) =>
  createSelector(
    selectProductEntities,
    entities => entities[id]
  );

export const selectProductsByCategory = (category: string) =>
  createSelector(
    selectAllProducts,
    products => products.filter(product => product.category === category)
  );

// A product is new for 30 days after its creation date.
export const selectNewArrivals = createSelector(
  selectAllProducts,
  (products: Product[]) => {
    const now = Date.now();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

    return products.filter(product => {
      if (!product.createdAt) return false;

      const createdAt = new Date(product.createdAt).getTime();
      if (Number.isNaN(createdAt)) return false;

      const ageInMs = now - createdAt;
      return ageInMs >= 0 && ageInMs <= thirtyDaysInMs;
    });
  }
);

// ID sets let components apply the same derived flags while sorting filtered products.
export const selectNewProductIds = createSelector(
  selectNewArrivals,
  products => new Set(products.map(product => product.id))
);

// Featured products are derived from rating and review count, not admin checkboxes.
export const selectFeaturedProducts = createSelector(
  selectAllProducts,
  products => products
    .filter(product => product.rating >= 4.5 && product.reviewsCount >= 10)
    .sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount)
    .slice(0, 8)
);

export const selectFeaturedProductIds = createSelector(
  selectAllProducts,
  products => new Set(
    products
      .filter(product => product.rating >= 4.5 && product.reviewsCount >= 10)
      .map(product => product.id)
  )
);

// Same category, current product excluded — used for Similar Products.
export const selectSimilarProducts = (category: string, excludeProductId: string) =>
  createSelector(
    selectAllProducts,
    products => products.filter(
      product => product.category === category && product.id !== excludeProductId
    )
  );
