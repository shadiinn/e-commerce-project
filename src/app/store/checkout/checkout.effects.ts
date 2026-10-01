import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { createEffect } from '@ngrx/effects';
import { tap } from 'rxjs';
import { selectCheckoutState } from './checkout.selectors';
import { CHECKOUT_STORAGE_KEY } from './checkout.state';

@Injectable()
export class CheckoutEffects {
  private store = inject(Store);

  // Mirrors the checkout state into sessionStorage so a refresh keeps it.
  persistCheckout$ = createEffect(
    () =>
      this.store.select(selectCheckoutState).pipe(
        tap(state => sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(state)))
      ),
    { dispatch: false }
  );
}