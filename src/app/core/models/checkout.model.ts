export interface CheckoutItem {

  productId: string;

  size: string;

  quantity: number;

}

export type CheckoutMode =
  | 'cart'
  | 'buy-now';