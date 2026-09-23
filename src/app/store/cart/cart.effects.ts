import {
  Injectable,
  inject
} from '@angular/core';

import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import {
  catchError,
  concatMap,
  forkJoin,
  map,
  of,
  switchMap
} from 'rxjs';

import {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  loadCart,
  loadCartSuccess,
  loadCartFailure
} from './cart.actions';

import { CartService } from '../../core/services/cart.service';

import {
  loadProductsSuccess
} from '../products/products.actions';

import { CartItem } from '../../core/models/cart.model';


@Injectable()
export class CartEffects {

  private actions$ =
    inject(Actions);

  private cartService =
    inject(CartService);


  // =====================================================
  // LOAD CART AFTER PRODUCTS ARE LOADED
  // =====================================================

  loadCartAfterProducts$ = createEffect(() =>

    this.actions$.pipe(

      ofType(loadProductsSuccess),

      map(() =>
        loadCart()
      )

    )

  );


  // =====================================================
  // LOAD CART
  // =====================================================

  loadCart$ = createEffect(() =>

    this.actions$.pipe(

      ofType(loadCart),

      switchMap(() =>

        this.cartService
          .getCart()
          .pipe(

            map(items =>

              loadCartSuccess({
                items
              })

            ),

            catchError(error =>

              of(

                loadCartFailure({

                  error:
                    error.message ??
                    'Failed to load cart'

                })

              )

            )

          )

      )

    )

  );


  // =====================================================
  // ADD TO CART
  // =====================================================

  addToCart$ = createEffect(

    () =>

      this.actions$.pipe(

        ofType(addToCart),

        concatMap(
          ({
            product,
            size,
            color
          }) => {

            return this.cartService
              .getCart()
              .pipe(

                switchMap(items => {

                  // =====================================
                  // FIND SAME PRODUCT VARIANT
                  // =====================================

                  const existingItem =
                    items.find(

                      item =>

                        item.productId ===
                          product.id &&

                        item.size ===
                          size &&

                        item.color ===
                          color

                    );


                  // =====================================
                  // ITEM ALREADY EXISTS
                  // =====================================

                  if (existingItem) {

                    return this.cartService
                      .updateCartItem(

                        existingItem.id!,

                        existingItem.quantity + 1

                      );

                  }


                  // =====================================
                  // NEW CART ITEM
                  // =====================================

                  const cartItem: CartItem = {

                    productId:
                      product.id,

                    size,

                    color,

                    quantity: 1

                  };


                  return this.cartService
                    .addCartItem(
                      cartItem
                    );

                }),

                catchError(error => {

                  console.error(
                    'Failed to persist cart item:',
                    error
                  );

                  return of(null);

                })

              );

          }

        )

      ),

    {
      dispatch: false
    }

  );


  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  increaseQuantity$ = createEffect(

    () =>

      this.actions$.pipe(

        ofType(increaseQuantity),

        concatMap(
          ({ cartItemId }) =>

            this.cartService
              .getCart()
              .pipe(

                switchMap(items => {

                  const item =
                    items.find(

                      item =>
                        item.id ===
                        cartItemId

                    );


                  // ===================================
                  // ITEM NOT FOUND
                  // ===================================

                  if (!item) {

                    return of(null);

                  }


                  // ===================================
                  // UPDATE QUANTITY
                  // ===================================

                  return this.cartService
                    .updateCartItem(

                      cartItemId,

                      item.quantity + 1

                    );

                }),

                catchError(error => {

                  console.error(
                    'Failed to increase cart quantity:',
                    error
                  );

                  return of(null);

                })

              )

        )

      ),

    {
      dispatch: false
    }

  );


  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  decreaseQuantity$ = createEffect(

    () =>

      this.actions$.pipe(

        ofType(decreaseQuantity),

        concatMap(
          ({ cartItemId }) =>

            this.cartService
              .getCart()
              .pipe(

                switchMap(items => {

                  const item =
                    items.find(

                      item =>
                        item.id ===
                        cartItemId

                    );


                  // ===================================
                  // ITEM NOT FOUND
                  // ===================================

                  if (!item) {

                    return of(null);

                  }


                  const newQuantity =
                    item.quantity - 1;


                  // ===================================
                  // REMOVE WHEN ZERO
                  // ===================================

                  if (
                    newQuantity <= 0
                  ) {

                    return this.cartService
                      .removeCartItem(
                        cartItemId
                      );

                  }


                  // ===================================
                  // UPDATE QUANTITY
                  // ===================================

                  return this.cartService
                    .updateCartItem(

                      cartItemId,

                      newQuantity

                    );

                }),

                catchError(error => {

                  console.error(
                    'Failed to decrease cart quantity:',
                    error
                  );

                  return of(null);

                })

              )

        )

      ),

    {
      dispatch: false
    }

  );


  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  removeFromCart$ = createEffect(

    () =>

      this.actions$.pipe(

        ofType(removeFromCart),

        concatMap(
          ({ cartItemId }) =>

            this.cartService
              .removeCartItem(
                cartItemId
              )
              .pipe(

                catchError(error => {

                  console.error(
                    'Failed to remove cart item:',
                    error
                  );

                  return of(null);

                })

              )

        )

      ),

    {
      dispatch: false
    }

  );


  // =====================================================
  // CLEAR CART
  // =====================================================

  clearCart$ = createEffect(

    () =>

      this.actions$.pipe(

        ofType(clearCart),

        concatMap(() =>

          this.cartService
            .getCart()
            .pipe(

              switchMap(items => {

                // =====================================
                // CART ALREADY EMPTY
                // =====================================

                if (
                  items.length === 0
                ) {

                  return of(null);

                }


                // =====================================
                // DELETE ALL ITEMS
                // =====================================

                return forkJoin(

                  items.map(item =>

                    this.cartService
                      .removeCartItem(
                        item.id!
                      )

                  )

                );

              }),

              catchError(error => {

                console.error(
                  'Failed to clear cart:',
                  error
                );

                return of(null);

              })

            )

        )

      ),

    {
      dispatch: false
    }

  );

}