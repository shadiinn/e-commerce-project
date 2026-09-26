import {
  Injectable
} from '@angular/core';

import {
  GuestCartItem
} from '../models/guest-cart.model';

import { CART_LIMITS } from '../models/constants/cart.constants';


@Injectable({
  providedIn: 'root'
})
export class GuestCartService {

  private readonly STORAGE_KEY =
    'sa_guest_cart';


  // =====================================================
  // GET GUEST CART
  // =====================================================

  getCart(): GuestCartItem[] {

    const storedCart =
      localStorage.getItem(
        this.STORAGE_KEY
      );

    if (!storedCart) {

      return [];

    }


    try {

      return JSON.parse(
        storedCart
      ) as GuestCartItem[];

    } catch (error) {

      console.error(
        'FAILED TO READ GUEST CART:',
        error
      );

      return [];

    }

  }


  // =====================================================
  // SAVE GUEST CART
  // =====================================================

  private saveCart(
    items: GuestCartItem[]
  ): void {

    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(items)
    );

  }


  // =====================================================
  // ADD ITEM
  // =====================================================

  addItem(
    item: GuestCartItem
  ): boolean {

    const cart =
      this.getCart();


    const existingItem =
      cart.find(
        cartItem =>
          cartItem.id === item.id
      );


    // ---------------------------------------------------
    // EXISTING ITEM
    // ---------------------------------------------------

    if (existingItem) {

      const productQuantity =
        cart

          .filter(
            cartItem =>
              cartItem.productId ===
              item.productId
          )

          .reduce(
            (total, cartItem) =>
              total + cartItem.quantity,
            0
          );


      if (
        productQuantity >=
        CART_LIMITS.MAX_QUANTITY_PER_PRODUCT
      ) {

        return false;

      }


      existingItem.quantity +=
        item.quantity;


      this.saveCart(cart);

      return true;

    }


    // ---------------------------------------------------
    // MAX DISTINCT PRODUCTS
    // ---------------------------------------------------

    const distinctProductCount =
      new Set(
        cart.map(
          cartItem =>
            cartItem.productId
        )
      ).size;


    if (
      distinctProductCount >=
      CART_LIMITS.MAX_DISTINCT_PRODUCTS
    ) {

      return false;

    }


    // ---------------------------------------------------
    // NEW ITEM
    // ---------------------------------------------------

    cart.push(item);

    this.saveCart(cart);

    return true;

  }


  // =====================================================
  // UPDATE QUANTITY
  // =====================================================

  updateQuantity(
    cartItemId: string,
    quantity: number
  ): void {

    const cart =
      this.getCart();


    const item =
      cart.find(
        cartItem =>
          cartItem.id === cartItemId
      );


    if (!item) {

      return;

    }


    if (quantity <= 0) {

      const updatedCart =
        cart.filter(
          cartItem =>
            cartItem.id !== cartItemId
        );

      this.saveCart(
        updatedCart
      );

      return;

    }


    item.quantity =
      Math.min(
        quantity,
        CART_LIMITS.MAX_QUANTITY_PER_PRODUCT
      );


    this.saveCart(cart);

  }


  // =====================================================
  // REMOVE ITEM
  // =====================================================

  removeItem(
    cartItemId: string
  ): void {

    const cart =
      this.getCart();


    const updatedCart =
      cart.filter(
        item =>
          item.id !== cartItemId
      );


    this.saveCart(
      updatedCart
    );

  }


  // =====================================================
  // CLEAR CART
  // =====================================================

  clearCart(): void {

    localStorage.removeItem(
      this.STORAGE_KEY
    );

  }

}
