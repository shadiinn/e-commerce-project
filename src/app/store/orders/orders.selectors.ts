import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import { OrdersState } from './orders.state';

export const selectOrdersState =
  createFeatureSelector<OrdersState>('orders');

export const selectOrders = createSelector(
  selectOrdersState,

  // Newest order first. Sorted here (rather than where orders
  // are loaded/added) so every consumer of selectOrders sees the
  // same order, regardless of the order they were fetched or
  // created in.
  state =>
    [...state.orders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
);

export const selectOrdersLoading = createSelector(
  selectOrdersState,
  state => state.loading
);

export const selectOrdersError = createSelector(
  selectOrdersState,
  state => state.error
);

export const selectLastCreatedOrder = createSelector(
  selectOrdersState,
  state => state.lastCreatedOrder
);

export const selectOrderById =
  (id: string) =>
    createSelector(
      selectOrders,
      orders => orders.find(order => order.id === id)
    );