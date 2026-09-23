import { createAction, props } from '@ngrx/store';

import {
  CheckoutItem,
  CheckoutMode
} from '../../core/models/checkout.model';


// =====================================================
// START CHECKOUT
// =====================================================

export const startCheckout = createAction(
  '[Checkout] Start Checkout',
  props<{
    mode: CheckoutMode;
    items: CheckoutItem[];
  }>()
);


// =====================================================
// CLEAR CHECKOUT
// =====================================================

export const clearCheckout = createAction(
  '[Checkout] Clear Checkout'
);