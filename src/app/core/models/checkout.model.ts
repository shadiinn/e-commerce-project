export interface CheckoutItem {

  productId: string;

  variantId: string;

  size: string;

  quantity: number;

}


export type CheckoutMode =
  | 'cart'
  | 'buy-now';
