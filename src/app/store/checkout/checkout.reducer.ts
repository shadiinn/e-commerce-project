import {
  createReducer,
  on
} from '@ngrx/store';

import {
  startCheckout,
  clearCheckout
} from './checkout.actions';

import {
  CheckoutState,
  initialCheckoutState
} from './checkout.state';


export const checkoutReducer =
  createReducer(

    initialCheckoutState,


    // ===================================================
    // START CHECKOUT
    // ===================================================

    on(
      startCheckout,

      (
        state,
        {
          mode,
          items
        }
      ) => ({

        ...state,

        mode,

        items

      })

    ),


    // ===================================================
    // CLEAR CHECKOUT
    // ===================================================

    on(
      clearCheckout,

      () =>
        initialCheckoutState

    )

  );
