import { CartItem } from '../../core/models/cart.model';
import { GuestCartItem } from '../../core/models/guest-cart.model';

export interface CartState {

  // Logged-in user's cart
  items: CartItem[];

  // Guest user's cart
  guestItems: GuestCartItem[];

  loading: boolean;

  error: string | null;
}

export const initialCartState: CartState = {

  items: [],

  guestItems: [],

  loading: false,

  error: null
};