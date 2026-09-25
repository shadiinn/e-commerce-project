import { Injectable } from '@angular/core';
import { GuestCartItem } from '../models/guest-cart.model';

@Injectable({
  providedIn: 'root'
})
export class GuestCartService {

  private readonly STORAGE_KEY = 'sa_guest_cart';


  // =====================================================
  // GET GUEST CART
  // =====================================================

  getCart(): GuestCartItem[] {

    const storedCart =
      localStorage.getItem(this.STORAGE_KEY);

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
  ): void {

    const cart =
      this.getCart();

    const existingItem =
      cart.find(
        cartItem =>
          cartItem.id === item.id
      );


    // ---------------------------------------------------
    // ITEM ALREADY EXISTS
    // ---------------------------------------------------

    if (existingItem) {

      existingItem.quantity +=
        item.quantity;

    }


    // ---------------------------------------------------
    // NEW ITEM
    // ---------------------------------------------------

    else {

      cart.push(item);

    }


    this.saveCart(cart);

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


    // ---------------------------------------------------
    // REMOVE WHEN QUANTITY REACHES ZERO
    // ---------------------------------------------------

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


    // ---------------------------------------------------
    // UPDATE QUANTITY
    // ---------------------------------------------------

    item.quantity =
      quantity;

    this.saveCart(
      cart
    );

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