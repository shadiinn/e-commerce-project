import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';

import {
  selectCheckoutMode,
  selectCheckoutItems,
  selectCheckoutItemsWithProducts,
  selectCheckoutSubtotal
} from '../../store/checkout/checkout.selectors';

import { clearCheckout } from '../../store/checkout/checkout.actions';

import { placeOrder } from '../../store/orders/orders.actions';

import {
  CreateOrderRequest
} from '../../core/models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent {

  private store = inject(Store);
  private fb = inject(FormBuilder);


  // =====================================================
  // CHECKOUT STATE
  // =====================================================

  checkoutMode$ =
    this.store.select(
      selectCheckoutMode
    );

  // Raw checkout items
  checkoutItemsRaw$ =
    this.store.select(
      selectCheckoutItems
    );

  // Checkout items joined with Product Entity
  checkoutItems$ =
    this.store.select(
      selectCheckoutItemsWithProducts
    );

  checkoutSubtotal$ =
    this.store.select(
      selectCheckoutSubtotal
    );


  // =====================================================
  // CHECKOUT FORM
  // =====================================================

  checkoutForm = this.fb.group({

    // -----------------------------------------------
    // CONTACT
    // -----------------------------------------------

    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    phone: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/)
      ]
    ],


    // -----------------------------------------------
    // SHIPPING ADDRESS
    // -----------------------------------------------

    firstName: [
      '',
      Validators.required
    ],

    lastName: [
      '',
      Validators.required
    ],

    address: [
      '',
      Validators.required
    ],

    apartment: [
      ''
    ],

    city: [
      '',
      Validators.required
    ],

    state: [
      '',
      Validators.required
    ],

    postalCode: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{6}$/)
      ]
    ],

    country: [
      'India',
      Validators.required
    ],


    // -----------------------------------------------
    // PAYMENT
    // -----------------------------------------------

    paymentMethod: [
      'cod',
      Validators.required
    ]

  });


  // =====================================================
  // PLACE ORDER
  // =====================================================

  placeOrder(): void {

    console.log('================================');
    console.log('PLACE ORDER CLICKED');
    console.log('================================');

    if (this.checkoutForm.invalid) {

      console.log(
        'CHECKOUT FORM IS INVALID'
      );

      this.checkoutForm.markAllAsTouched();

      return;
    }

    console.log(
      'CHECKOUT FORM IS VALID'
    );

    this.checkoutItemsRaw$
      .pipe(take(1))
      .subscribe(items => {

        console.log(
          'RAW CHECKOUT ITEMS:',
          items
        );

      });

    this.checkoutItems$
      .pipe(take(1))
      .subscribe(items => {

        console.log(
          'CHECKOUT ITEMS WITH PRODUCTS:',
          items
        );

        if (!items.length) {

          console.log(
            'NO CHECKOUT ITEMS'
          );

          return;
        }

        const formValue =
          this.checkoutForm.getRawValue();

        const request: CreateOrderRequest = {

          items: items.map(item => ({

            productId:
              item.product.id,

            size:
              item.size,

            quantity:
              item.quantity

          })),

          shippingAddress: {

            firstName:
              formValue.firstName!,

            lastName:
              formValue.lastName!,

            address:
              formValue.address!,

            apartment:
              formValue.apartment ?? '',

            city:
              formValue.city!,

            state:
              formValue.state!,

            postalCode:
              formValue.postalCode!,

            country:
              formValue.country!,

            phone:
              formValue.phone!,

            email:
              formValue.email!

          },

          paymentMethod:
            formValue.paymentMethod as
              'cod' | 'online'

        };

        console.log(
          'ORDER REQUEST:',
          request
        );

        this.store.dispatch(
          placeOrder({
            request
          })
        );

        console.log(
          'PLACE ORDER DISPATCHED'
        );

      });
  }
  // =====================================================
  // CANCEL CHECKOUT
  // =====================================================

  cancelCheckout(): void {

    this.store.dispatch(
      clearCheckout()
    );

  }

}