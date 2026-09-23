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
  clearCart
} from '../../store/cart/cart.actions';
import { startCheckout } from '../../store/checkout/checkout.actions';
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

    this.store.dispatch(
      increaseQuantity({
        cartItemId
      })
    );

  }


  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  decreaseQuantity(
    cartItemId: string
  ): void {

    this.store.dispatch(
      decreaseQuantity({
        cartItemId
      })
    );

  }


  // =====================================================
  // REMOVE ITEM
  // =====================================================

  removeItem(
    cartItemId: string
  ): void {

    this.store.dispatch(
      removeFromCart({
        cartItemId
      })
    );

  }


  // =====================================================
  // CLEAR CART
  // =====================================================

  clearCart(): void {

    this.store.dispatch(
      clearCart()
    );

  }

  proceedToCheckout(): void {

    console.log('PROCEED TO CHECKOUT CLICKED');

    this.cartItems$
      .pipe(take(1))
      .subscribe(items => {

        console.log('CART ITEMS:', items);

        const checkoutItems = items.map(item => ({
          productId: item.product.id,
          size: item.size,
          color: item.color,
          quantity: item.quantity
        }));

        console.log('CHECKOUT ITEMS TO STORE:', checkoutItems);

        this.store.dispatch(
          startCheckout({
            mode: 'cart',
            items: checkoutItems
          })
        );

        console.log('START CHECKOUT DISPATCHED');

        this.router.navigate(['/checkout']);
      });
  }

}