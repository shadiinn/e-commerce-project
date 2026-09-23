import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import { OrdersState } from './orders.state';

export const selectOrdersState =
  createFeatureSelector<OrdersState>('orders');

export const selectOrders = createSelector(
  selectOrdersState,
  state => state.orders
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