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
  cancelOrderFailure,
  resetOrders
} from './orders.actions';

import {
  OrdersState,
  initialOrdersState
} from './orders.state';


export const ordersReducer = createReducer(

  initialOrdersState,


  // =====================================================
  // LOAD ORDERS
  // =====================================================

  on(
    loadOrders,
    state => ({
      ...state,
      loading: true,
      error: null
    })
  ),


  // =====================================================
  // LOAD ORDERS SUCCESS
  // =====================================================

  on(
    loadOrdersSuccess,
    (state, { orders }) => ({
      ...state,
      orders,
      loading: false,
      error: null
    })
  ),


  // =====================================================
  // LOAD ORDERS FAILURE
  // =====================================================

  on(
    loadOrdersFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error
    })
  ),


  // =====================================================
  // PLACE ORDER
  // =====================================================

  on(
    placeOrder,
    state => ({
      ...state,
      loading: true,
      error: null
    })
  ),


  // =====================================================
  // PLACE ORDER SUCCESS
  // =====================================================

  on(
    placeOrderSuccess,
    (state, { order }) => ({
      ...state,

      orders: [
        ...state.orders,
        order
      ],

      lastCreatedOrder: order,

      loading: false,

      error: null
    })
  ),


  // =====================================================
  // PLACE ORDER FAILURE
  // =====================================================

  on(
    placeOrderFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error
    })
  ),


  // =====================================================
  // LOAD ORDER BY ID
  // =====================================================

  on(
    loadOrderById,
    state => ({
      ...state,
      loading: true,
      error: null
    })
  ),


  // =====================================================
  // LOAD ORDER BY ID SUCCESS
  // =====================================================

  on(
    loadOrderByIdSuccess,
    (state, { order }) => ({
      ...state,

      orders: state.orders.some(
        existingOrder =>
          existingOrder.id === order.id
      )

        ? state.orders.map(
            existingOrder =>
              existingOrder.id === order.id
                ? order
                : existingOrder
          )

        : [
            ...state.orders,
            order
          ],

      lastCreatedOrder: order,

      loading: false,

      error: null
    })
  ),


  // =====================================================
  // LOAD ORDER BY ID FAILURE
  // =====================================================

  on(
    loadOrderByIdFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error
    })
  ),


  // =====================================================
  // CANCEL ORDER
  // =====================================================

  on(
    cancelOrder,
    state => ({
      ...state,
      loading: true,
      error: null
    })
  ),


  // =====================================================
  // CANCEL ORDER SUCCESS
  // =====================================================

  on(
    cancelOrderSuccess,
    (state, { order }) => ({
      ...state,

      orders: state.orders.map(
        existingOrder =>
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
    })
  ),


  // =====================================================
  // CANCEL ORDER FAILURE
  // =====================================================

  on(
    cancelOrderFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error
    })
  ),


  // =====================================================
  // RESET ORDERS AFTER LOGOUT
  // =====================================================

  on(
    resetOrders,
    state => ({
      ...state,
      orders: [],
      lastCreatedOrder: null,
      loading: false,
      error: null
    })
  )

);