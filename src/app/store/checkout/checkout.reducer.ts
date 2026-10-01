import { createReducer, on } from '@ngrx/store';
import { startCheckout, clearCheckout } from './checkout.actions';
import { initialCheckoutState, loadCheckoutState } from './checkout.state';

export const checkoutReducer = createReducer(
  loadCheckoutState(),
  on(startCheckout, (_, { mode, items }) => ({ mode, items })),
  on(clearCheckout, () => initialCheckoutState)
);