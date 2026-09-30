import {
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  AsyncPipe,
  CurrencyPipe,
  DatePipe
} from '@angular/common';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import { Store } from '@ngrx/store';

import {
  cancelOrder as cancelOrderAction,
  loadOrderById
} from '../../store/orders/orders.actions';

import {
  selectOrderById
} from '../../store/orders/orders.selectors';

import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [
    AsyncPipe,
    CurrencyPipe,
    DatePipe,
    RouterLink
  ],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css'
})
export class OrderDetailsComponent implements OnInit {

  private store = inject(Store);
  private route = inject(ActivatedRoute);

  orderId = '';

  order$ = this.store.select(
    selectOrderById('')
  );

  ngOnInit(): void {

    this.orderId =
      this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.orderId) {
      return;
    }

    this.order$ =
      this.store.select(
        selectOrderById(this.orderId)
      );

    this.store.dispatch(
      loadOrderById({
        id: this.orderId
      })
    );
  }


  // =====================================================
  // CANCEL ORDER
  // =====================================================

  canCancel(order: Order): boolean {

    return (
      order.orderStatus === 'pending' ||
      order.orderStatus === 'confirmed'
    );

  }


  // Order the confirmation popup is currently open for
  // (null when the popup is closed)
  orderPendingCancellation =
    signal<Order | null>(null);


  requestCancelOrder(
    order: Order
  ): void {

    if (!this.canCancel(order)) {
      return;
    }

    this.orderPendingCancellation.set(
      order
    );

  }


  dismissCancelPopup(): void {

    this.orderPendingCancellation.set(
      null
    );

  }


  confirmCancelOrder(): void {

    const order =
      this.orderPendingCancellation();

    if (!order) {
      return;
    }

    this.store.dispatch(
      cancelOrderAction({
        id: order.id
      })
    );

    this.orderPendingCancellation.set(
      null
    );

  }

}