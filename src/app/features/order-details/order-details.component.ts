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
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import { Store } from '@ngrx/store';

import {
  loadOrderById
} from '../../store/orders/orders.actions';

import {
  selectOrderById
} from '../../store/orders/orders.selectors';

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
}