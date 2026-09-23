import {
  CheckoutItem,
  CheckoutMode
} from '../../core/models/checkout.model';


export interface CheckoutState {

  mode: CheckoutMode | null;

  items: CheckoutItem[];

}


export const initialCheckoutState: CheckoutState = {

  mode: null,

  items: []

};