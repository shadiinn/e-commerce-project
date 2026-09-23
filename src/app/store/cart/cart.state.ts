import { CartItem } from '../../core/models/cart.model';

export interface CartState {

  items: CartItem[];

  loading: boolean;

  error: string | null;

}

export const initialCartState: CartState = {

  items: [],

  loading: false,

  error: null

};