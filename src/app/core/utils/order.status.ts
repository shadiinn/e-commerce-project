import { Order } from '../models/order.model';

/*
  ORDER STATUS RULES (used by the admin pages)

  An order moves forward step by step and can be cancelled only BEFORE it is shipped:

        pending ──► confirmed ──► shipped ──► delivered
           │            │
           └────────────┴──► cancelled

  "delivered" and "cancelled" are final: nothing can change them any more.
  (New orders start as "confirmed" because the checkout sets that status.)
*/

export type OrderStatus = Order['orderStatus'];

// In the order they happen (used for lists, tabs and the progress bar)
export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
];

// The steps shown in the progress bar of an order
export const ORDER_PROGRESS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered'
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

// Badge colours (full class names, so Tailwind can find them)
export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  confirmed: 'border-blue-200 bg-blue-50 text-blue-700',
  processing: 'border border-purple-200 bg-purple-50 text-purple-700',
  shipped: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  delivered: 'border-green-200 bg-green-50 text-green-700',
  cancelled: 'border-red-200 bg-red-50 text-red-700'
};

// The same colours for charts
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#d97706',
  confirmed: '#2563eb',
  processing: '#7c3aed',
  shipped: '#4f46e5',
  delivered: '#16a34a',
  cancelled: '#dc2626'
};

// Which statuses may an order move to from its current status?
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing','cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

export function getNextStatuses(status: OrderStatus): OrderStatus[] {
  return NEXT_STATUSES[status];
}

// What must be saved when the admin moves an order to a new status.
// Cash on delivery is paid when the parcel is delivered, so payment becomes "paid" then.
export function buildStatusChange(order: Order, nextStatus: OrderStatus): Partial<Order> {
  const changes: Partial<Order> = { orderStatus: nextStatus };

  if (nextStatus === 'delivered' && order.paymentMethod === 'cod') {
    changes.paymentStatus = 'paid';
  }

  return changes;
}