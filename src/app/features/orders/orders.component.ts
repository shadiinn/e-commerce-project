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
  loadOrders
} from '../../store/orders/orders.actions';

import {
  selectOrders,
  selectOrdersLoading,
  selectOrdersError
} from '../../store/orders/orders.selectors';

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

  // Cancelling an order is done from the order details page now,
  // not from this list.
}