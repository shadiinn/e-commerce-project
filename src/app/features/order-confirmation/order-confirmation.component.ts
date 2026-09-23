import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import { AsyncPipe } from '@angular/common';

import { Store } from '@ngrx/store';

import {
  loadOrderById
} from '../../store/orders/orders.actions';

import {
  selectOrderById
} from '../../store/orders/orders.selectors';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink
  ],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.css'
})
export class OrderConfirmationComponent
  implements OnInit {

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