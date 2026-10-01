import { CheckoutItem, CheckoutMode } from '../../core/models/checkout.model';

export interface CheckoutState {
  mode: CheckoutMode | null;
  items: CheckoutItem[];
}

export const CHECKOUT_STORAGE_KEY = 'sa_checkout';

export const initialCheckoutState: CheckoutState = { mode: null, items: [] };

/** Restores the checkout after a page refresh. */
export function loadCheckoutState(): CheckoutState {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CHECKOUT_STORAGE_KEY) ?? 'null');
    return saved?.items?.length ? saved : initialCheckoutState;
  } catch {
    return initialCheckoutState;
  }
}