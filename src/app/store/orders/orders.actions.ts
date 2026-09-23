import { createAction, props } from '@ngrx/store';

import {
  CreateOrderRequest,
  Order
} from '../../core/models/order.model';

export const loadOrders = createAction(
  '[Orders] Load Orders'
);

export const loadOrdersSuccess = createAction(
  '[Orders] Load Orders Success',
  props<{ orders: Order[] }>()
);

export const loadOrdersFailure = createAction(
  '[Orders] Load Orders Failure',
  props<{ error: string }>()
);

export const placeOrder = createAction(
  '[Orders] Place Order',
  props<{ request: CreateOrderRequest }>()
);

export const placeOrderSuccess = createAction(
  '[Orders] Place Order Success',
  props<{ order: Order }>()
);

export const placeOrderFailure = createAction(
  '[Orders] Place Order Failure',
  props<{ error: string }>()
);

export const loadOrderById = createAction(
  '[Orders] Load Order By Id',
  props<{ id: string }>()
);

export const loadOrderByIdSuccess = createAction(
  '[Orders] Load Order By Id Success',
  props<{ order: Order }>()
);

export const loadOrderByIdFailure = createAction(
  '[Orders] Load Order By Id Failure',
  props<{ error: string }>()
);

export const cancelOrder = createAction(
  '[Orders] Cancel Order',
  props<{ id: string }>()
);

export const cancelOrderSuccess = createAction(
  '[Orders] Cancel Order Success',
  props<{ order: Order }>()
);

export const cancelOrderFailure = createAction(
  '[Orders] Cancel Order Failure',
  props<{ error: string }>()
);