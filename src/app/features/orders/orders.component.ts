import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  AsyncPipe,
  CurrencyPipe,
  DatePipe
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

import {
  Store
} from '@ngrx/store';

import {
  cancelOrder as cancelOrderAction,
  loadOrders
} from '../../store/orders/orders.actions';

import {
  selectOrders,
  selectOrdersLoading,
  selectOrdersError
} from '../../store/orders/orders.selectors';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    AsyncPipe,
    CurrencyPipe,
    DatePipe,
    RouterLink
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {

  private store = inject(Store);

  orders$ = this.store.select(selectOrders);

  loading$ =
    this.store.select(selectOrdersLoading);

  error$ =
    this.store.select(selectOrdersError);


  ngOnInit(): void {
    console.log('ORDERS PAGE LOADED');
    this.store.dispatch(
      loadOrders()
    );
    console.log('LOAD ORDERS DISPATCHED');

  }

  canCancel(order: Order): boolean {

    return (
      order.orderStatus === 'pending' ||
      order.orderStatus === 'confirmed'
    );

  }


  cancelOrder(order: Order): void {

    if (!this.canCancel(order)) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel order ${order.orderNumber}?`
    );

    if (!confirmed) {
      return;
    }

    this.store.dispatch(
      cancelOrderAction({
        id: order.id
      })
    );

  }
}