import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import {
  selectCartItemsWithProducts,
  selectCartItemCount,
  selectCartSubtotal
} from '../../store/cart/cart.selectors';

import {
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,

  increaseGuestQuantity,
  decreaseGuestQuantity,
  removeGuestItem,
  clearGuestCart
} from '../../store/cart/cart.actions';

import {
  selectIsAuthenticated
} from '../../store/auth/auth.selectors';

import {
  startCheckout
} from '../../store/checkout/checkout.actions';

import { take } from 'rxjs';


@Component({
  selector: 'app-cart',

  standalone: true,

  imports: [
    RouterLink,
    AsyncPipe
  ],

  templateUrl: './cart.component.html',

  styleUrl: './cart.component.css'
})
export class CartComponent {

  private store = inject(Store);

  private router = inject(Router);


  // =====================================================
  // AUTHENTICATION
  // =====================================================

  isAuthenticated$ =
    this.store.select(
      selectIsAuthenticated
    );


  // =====================================================
  // CART ITEMS
  // =====================================================

  cartItems$ =
    this.store.select(
      selectCartItemsWithProducts
    );


  // =====================================================
  // CART ITEM COUNT
  // =====================================================

  cartItemCount$ =
    this.store.select(
      selectCartItemCount
    );


  // =====================================================
  // CART SUBTOTAL
  // =====================================================

  cartSubtotal$ =
    this.store.select(
      selectCartSubtotal
    );


  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  increaseQuantity(
    cartItemId: string
  ): void {

    this.isAuthenticated$
      .pipe(take(1))
      .subscribe(isAuthenticated => {

        // -------------------------------------------------
        // LOGGED-IN USER
        // -------------------------------------------------

        if (isAuthenticated) {

          this.store.dispatch(
            increaseQuantity({
              cartItemId
            })
          );

          return;
        }


        // -------------------------------------------------
        // GUEST USER
        // -------------------------------------------------

        this.store.dispatch(
          increaseGuestQuantity({
            cartItemId
          })
        );

      });

  }


  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  decreaseQuantity(
    cartItemId: string
  ): void {

    this.isAuthenticated$
      .pipe(take(1))
      .subscribe(isAuthenticated => {

        // -------------------------------------------------
        // LOGGED-IN USER
        // -------------------------------------------------

        if (isAuthenticated) {

          this.store.dispatch(
            decreaseQuantity({
              cartItemId
            })
          );

          return;
        }


        // -------------------------------------------------
        // GUEST USER
        // -------------------------------------------------

        this.store.dispatch(
          decreaseGuestQuantity({
            cartItemId
          })
        );

      });

  }


  // =====================================================
  // REMOVE ITEM
  // =====================================================

  removeItem(
    cartItemId: string
  ): void {

    this.isAuthenticated$
      .pipe(take(1))
      .subscribe(isAuthenticated => {

        // -------------------------------------------------
        // LOGGED-IN USER
        // -------------------------------------------------

        if (isAuthenticated) {

          this.store.dispatch(
            removeFromCart({
              cartItemId
            })
          );

          return;
        }


        // -------------------------------------------------
        // GUEST USER
        // -------------------------------------------------

        this.store.dispatch(
          removeGuestItem({
            cartItemId
          })
        );

      });

  }


  // =====================================================
  // CLEAR CART
  // =====================================================

  clearCart(): void {

    this.isAuthenticated$
      .pipe(take(1))
      .subscribe(isAuthenticated => {

        // -------------------------------------------------
        // LOGGED-IN USER
        // -------------------------------------------------

        if (isAuthenticated) {

          this.store.dispatch(
            clearCart()
          );

          return;
        }


        // -------------------------------------------------
        // GUEST USER
        // -------------------------------------------------

        this.store.dispatch(
          clearGuestCart()
        );

      });

  }


  // =====================================================
  // PROCEED TO CHECKOUT
  // =====================================================

  proceedToCheckout(): void {

    console.log(
      'PROCEED TO CHECKOUT CLICKED'
    );


    this.cartItems$
      .pipe(take(1))
      .subscribe(items => {

        console.log(
          'CART ITEMS:',
          items
        );


        // -------------------------------------------------
        // EMPTY CART
        // -------------------------------------------------

        if (!items.length) {

          console.log(
            'CART IS EMPTY'
          );

          return;

        }


        // -------------------------------------------------
        // CREATE CHECKOUT ITEMS
        // -------------------------------------------------

        const checkoutItems =
          items.map(item => ({

            productId:
              item.product.id,

            size:
              item.size,

            quantity:
              item.quantity

          }));


        console.log(
          'CHECKOUT ITEMS TO STORE:',
          checkoutItems
        );


        // -------------------------------------------------
        // START CHECKOUT
        // -------------------------------------------------

        this.store.dispatch(
          startCheckout({

            mode: 'cart',

            items:
              checkoutItems

          })
        );


        console.log(
          'START CHECKOUT DISPATCHED'
        );


        // -------------------------------------------------
        // NAVIGATE TO CHECKOUT
        // -------------------------------------------------

        this.router.navigate([
          '/checkout'
        ]);

      });

  }

}