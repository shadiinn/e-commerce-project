import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import {
  selectCheckoutMode,
  selectCheckoutItems,selectCheckoutItemsWithProducts,selectCheckoutSubtotal
} from '../../store/checkout/checkout.selectors';

import { clearCheckout } from '../../store/checkout/checkout.actions';
import { Product } from '../../core/models/product.model';


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

    if (
      this.checkoutForm.invalid
    ) {

      this.checkoutForm.markAllAsTouched();

      return;

    }


    console.log(
      'Checkout data:',
      this.checkoutForm.value
    );

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