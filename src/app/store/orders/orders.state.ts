import { Order } from '../../core/models/order.model';

export interface OrdersState {
  orders: Order[];
  lastCreatedOrder: Order | null;
  loading: boolean;
  error: string | null;
}

export const initialOrdersState: OrdersState = {
  orders: [],
  lastCreatedOrder: null,
  loading: false,
  error: null
};