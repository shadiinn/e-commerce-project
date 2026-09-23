import { createReducer, on } from '@ngrx/store';

import {
  loadOrders,
  loadOrdersSuccess,
  loadOrdersFailure,
  placeOrder,
  placeOrderSuccess,
  placeOrderFailure,
  loadOrderById,
  loadOrderByIdSuccess,
  loadOrderByIdFailure,
  cancelOrder,
  cancelOrderSuccess,
  cancelOrderFailure
} from './orders.actions';

import {
  OrdersState,
  initialOrdersState
} from './orders.state';

export const ordersReducer = createReducer(

  initialOrdersState,

  on(loadOrders, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(loadOrdersSuccess, (state, { orders }) => ({
    ...state,
    orders,
    loading: false,
    error: null
  })),

  on(loadOrdersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(placeOrder, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(placeOrderSuccess, (state, { order }) => ({
    ...state,
    orders: [...state.orders, order],
    lastCreatedOrder: order,
    loading: false,
    error: null
  })),

  on(placeOrderFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(loadOrderById, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(loadOrderByIdSuccess, (state, { order }) => ({
    ...state,
    orders: state.orders.some(
      existingOrder => existingOrder.id === order.id
    )
      ? state.orders.map(existingOrder =>
          existingOrder.id === order.id
            ? order
            : existingOrder
        )
      : [...state.orders, order],

    lastCreatedOrder: order,
    loading: false,
    error: null
  })),

  on(loadOrderByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(cancelOrder, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(cancelOrderSuccess, (state, { order }) => ({
    ...state,

    orders: state.orders.map(existingOrder =>
      existingOrder.id === order.id
        ? order
        : existingOrder
    ),

    lastCreatedOrder:
      state.lastCreatedOrder?.id === order.id
        ? order
        : state.lastCreatedOrder,

    loading: false,
    error: null
  })),

  on(cancelOrderFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);