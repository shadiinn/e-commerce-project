import {
  AsyncPipe
} from '@angular/common';

import {
  Component,
  inject
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  Store
} from '@ngrx/store';

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

import {
  take
} from 'rxjs';


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

  private store =
    inject(Store);

  private router =
    inject(Router);


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
  // CHECK IF QUANTITY CAN INCREASE
  // =====================================================

  canIncreaseQuantity(item: any): boolean {

    const variant =
      item.variant;

    if (!variant) {

      return false;

    }


    const size =
      variant.sizes.find(
        (size: any) =>
          size.size ===
          item.size
      );


    if (!size) {

      return false;

    }


    if (
      item.quantity >=
      size.stock
    ) {

      return false;

    }


    if (
      item.quantity >= 5
    ) {

      return false;

    }


    return true;

  }


  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  increaseQuantity(
    cartItemId: string
  ): void {

    this.isAuthenticated$
      .pipe(take(1))
      .subscribe(
        isAuthenticated => {

          if (isAuthenticated) {

            this.store.dispatch(
              increaseQuantity({
                cartItemId
              })
            );

            return;

          }


          this.store.dispatch(
            increaseGuestQuantity({
              cartItemId
            })
          );

        }
      );

  }


  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  decreaseQuantity(
    cartItemId: string
  ): void {

    this.isAuthenticated$
      .pipe(take(1))
      .subscribe(
        isAuthenticated => {

          if (isAuthenticated) {

            this.store.dispatch(
              decreaseQuantity({
                cartItemId
              })
            );

            return;

          }


          this.store.dispatch(
            decreaseGuestQuantity({
              cartItemId
            })
          );

        }
      );

  }


  // =====================================================
  // REMOVE ITEM
  // =====================================================

  removeItem(
    cartItemId: string
  ): void {

    this.isAuthenticated$
      .pipe(take(1))
      .subscribe(
        isAuthenticated => {

          if (isAuthenticated) {

            this.store.dispatch(
              removeFromCart({
                cartItemId
              })
            );

            return;

          }


          this.store.dispatch(
            removeGuestItem({
              cartItemId
            })
          );

        }
      );

  }


  // =====================================================
  // CLEAR CART
  // =====================================================

  clearCart(): void {

    this.isAuthenticated$
      .pipe(take(1))
      .subscribe(
        isAuthenticated => {

          if (isAuthenticated) {

            this.store.dispatch(
              clearCart()
            );

            return;

          }


          this.store.dispatch(
            clearGuestCart()
          );

        }
      );

  }


  // =====================================================
  // PROCEED TO CHECKOUT
  // =====================================================

  proceedToCheckout(): void {

    this.cartItems$
      .pipe(take(1))
      .subscribe(items => {

        if (!items.length) {

          return;

        }


        const checkoutItems =
          items.map(item => ({

            productId:
              item.product.id,

            variantId:
              item.variant.id,

            size:
              item.size,

            quantity:
              item.quantity

          }));


        this.store.dispatch(

          startCheckout({

            mode: 'cart',

            items:
              checkoutItems

          })

        );


        this.router.navigate([
          '/checkout'
        ]);

      });

  }

}
