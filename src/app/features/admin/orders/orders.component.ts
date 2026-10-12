import { DatePipe, LowerCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { Order } from '../../../core/models/order.model';
import {
  ORDER_PROGRESS,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  OrderStatus,
  getNextStatuses
} from '../../../core/utils/order.status';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent, paginate } from '../../../shared/components/pagination/pagination.component';
import { AdminDataService } from '../admin.service';

type StatusFilter = 'all' | OrderStatus;

/*
  The Orders page. It has two parts:
    1. the list: search, status tabs, a table and pagination
    2. a popup with ONE order: what was bought, who it is for, and the buttons to move it
       to the next status

  The orders come from AdminDataService (loaded once when the admin area opens).
  Which status buttons appear is decided by the rules in core/utils/order-status.ts.
*/
@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [DatePipe, LowerCasePipe, PaginationComponent, ConfirmDialogComponent],
  templateUrl: './orders.component.html'
})
export class AdminOrdersComponent {

  data = inject(AdminDataService);

  // for the template
  statusLabels = ORDER_STATUS_LABELS;
  statusStyles = ORDER_STATUS_STYLES;

  // The text of each action button in the popup
  actionLabels: Record<OrderStatus, string> = {
    pending: 'Mark as pending',
    confirmed: 'Confirm order',
    processing:'Mark as Processing',
    shipped: 'Mark as shipped',
    delivered: 'Mark as delivered',
    cancelled: 'Cancel order'
  };


  // ===================================================================
  // 1. THE LIST
  // ===================================================================

  readonly pageSize = 10;

  search = signal('');
  statusFilter = signal<StatusFilter>('all');
  currentPage = signal(1);

  // The tabs above the table: "All" and one per status, each with its number of orders
  tabs = computed(() => {
    const orders = this.data.orders();

    return [
      { value: 'all' as StatusFilter, label: 'All', count: orders.length },
      ...ORDER_STATUSES.map(status => ({
        value: status as StatusFilter,
        label: ORDER_STATUS_LABELS[status],
        count: orders.filter(order => order.orderStatus === status).length
      }))
    ];
  });

  // The orders that match the tab and the search, newest first
  private filteredOrders = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();

    return [...this.data.orders()]
      .filter(order => status === 'all' || order.orderStatus === status)
      .filter(order => !term || this.matchesSearch(order, term))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  // Only the orders of the current page
  orderPage = computed(() =>
    paginate(this.filteredOrders(), this.currentPage(), this.pageSize)
  );

  // The search looks at the order number, the customer's name, email and phone
  private matchesSearch(order: Order, term: string): boolean {
    const address = order.shippingAddress;

    return [
      order.orderNumber,
      `${address.firstName} ${address.lastName}`,
      address.email,
      address.phone
    ].some(text => text.toLowerCase().includes(term));
  }

  // a new search or filter starts again from page 1
  setSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(1);
  }

  setStatus(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  // number of pieces in an order (not the number of lines)
  pieces(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }


  // ===================================================================
  // 2. THE ORDER POPUP
  // ===================================================================

  // id of the order shown in the popup (null = popup closed)
  selectedOrderId = signal<string | null>(null);

  // The order itself, taken from the loaded list. Because it is read from the list, the
  // popup shows the new status right after a change.
  selectedOrder = computed(() =>
    this.data.orders().find(order => order.id === this.selectedOrderId()) ?? null
  );

  // the statuses this order may move to (empty for delivered and cancelled orders)
  nextStatuses = computed(() => {
    const order = this.selectedOrder();
    return order ? getNextStatuses(order.orderStatus) : [];
  });

  // The progress bar: Pending -> Confirmed -> Shipped -> Delivered (done steps are dark)
  progress = computed(() => {
    const order = this.selectedOrder();
    if (!order || order.orderStatus === 'cancelled') return [];

    const currentStep = ORDER_PROGRESS.indexOf(order.orderStatus);

    return ORDER_PROGRESS.map((status, index) => ({
      label: ORDER_STATUS_LABELS[status],
      done: index <= currentStep
    }));
  });

  // Every status change is confirmed before it is saved.
  statusToConfirm = signal<OrderStatus | null>(null);
  cancellationReason = signal('');
  cancellationDetails = signal('');
  cancellationReasons = [
    'Customer requested cancellation',
    'Item is out of stock',
    'Payment issue',
    'Delivery unavailable',
    'Suspected fraudulent order',
    'Other'
  ];

  confirmationMessage = computed(() => {
    const order = this.selectedOrder();
    const next = this.statusToConfirm();
    if (!order || !next) return '';
    if (next === 'confirmed') return `Confirm order ${order.orderNumber}? This will mark the order as accepted for processing.`;
    if (next === 'processing') return `Confirm order ${order.orderNumber}? This will mark the order as processing.`;
    if (next === 'shipped') return `Mark ${order.orderNumber} as shipped? Only do this after the parcel has been handed to the delivery carrier.`;
    if (next === 'delivered') return `Mark ${order.orderNumber} as delivered? This should only be done after delivery is confirmed.`;
    return `Change order ${order.orderNumber} to ${this.statusLabels[next].toLowerCase()}?`;
  });

  requestChange(status: OrderStatus): void {
    if (!this.nextStatuses().includes(status)) return;
    this.cancellationReason.set('');
    this.cancellationDetails.set('');
    this.statusToConfirm.set(status);
  }

  confirmChange(): void {
    const status = this.statusToConfirm();
    if (!status) return;

    if (status === 'cancelled') {
      const selected = this.cancellationReason();
      const details = this.cancellationDetails().trim();
      if (!selected || (selected === 'Other' && !details)) return;
      const reason = selected === 'Other' ? details : (details ? `${selected} — ${details}` : selected);
      this.applyChange(status, reason);
    } else {
      this.applyChange(status);
    }

    this.closeConfirmation();
  }

  closeConfirmation(): void {
    this.statusToConfirm.set(null);
    this.cancellationReason.set('');
    this.cancellationDetails.set('');
  }

  canConfirmCancellation(): boolean {
    return !!this.cancellationReason() && (this.cancellationReason() !== 'Other' || !!this.cancellationDetails().trim());
  }

  private applyChange(status: OrderStatus, reason = ''): void {
    const order = this.selectedOrder();
    if (order) this.data.changeOrderStatus(order, status, reason);
  }
}