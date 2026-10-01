import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';

import {
  selectCheckoutItemsWithProducts,
  selectCheckoutSubtotal
} from '../../store/checkout/checkout.selectors';
import { clearCheckout } from '../../store/checkout/checkout.actions';
import { placeOrder } from '../../store/orders/orders.actions';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { Address } from '../../core/models/address.model';
import { AddressFormComponent } from '../../shared/components/address-form/address-form.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, RouterLink, AddressFormComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent {

  private store = inject(Store);
  private fb = inject(FormBuilder);

  user = toSignal(this.store.select(selectCurrentUser), { initialValue: null });
  checkoutItems$ = this.store.select(selectCheckoutItemsWithProducts);
  checkoutSubtotal$ = this.store.select(selectCheckoutSubtotal);

  // The address itself is chosen inside <app-address-form>
  paymentOptions = [
    { value: 'cod', title: 'Cash on Delivery', note: 'Pay when your order is delivered.' },
    { value: 'online', title: 'Online Payment', note: 'Payment gateway integration will be added later.' }
  ];

  checkoutForm = this.fb.nonNullable.group({
    email: [this.user()?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.user()?.phone ?? '', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    paymentMethod: ['cod', Validators.required]
  });

  placeOrder(address: Address | null): void {
    if (this.checkoutForm.invalid || !address) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.checkoutItems$.pipe(take(1)).subscribe(items => {
      if (!items.length) return;

      const { email, phone, paymentMethod } = this.checkoutForm.getRawValue();

      this.store.dispatch(
        placeOrder({
          request: {
            items: items.map(item => ({
              productId: item.product.id,
              variantId: item.variant.id,
              size: item.size,
              quantity: item.quantity
            })),
            shippingAddress: {
              firstName: address.firstName,
              lastName: address.lastName,
              address: address.address,
              apartment: address.apartment,
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
              country: address.country,
              phone,
              email
            },
            paymentMethod: paymentMethod as 'cod' | 'online'
          }
        })
      );
    });
  }

  cancelCheckout(): void {
    this.store.dispatch(clearCheckout());
  }
}