export interface CheckoutItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}
export type CheckoutMode = 'cart' | 'buy-now';