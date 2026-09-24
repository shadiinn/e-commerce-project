import { Injectable, inject } from '@angular/core';

import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import {
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
  take,
  tap
} from 'rxjs';

import { Store } from '@ngrx/store';

import { CartService } from '../../core/services/cart.service';

import {
  loadCart,
  loadCartSuccess,
  loadCartFailure,
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  resetCart
} from './cart.actions';

import {
  loginSuccess,
  logout,
  restoreAuthSuccess
} from '../auth/auth.actions';

import { selectCurrentUser } from '../auth/auth.selectors';

import { CartItem } from '../../core/models/cart.model';


@Injectable()
export class CartEffects {

  private actions$ = inject(Actions);

  private store = inject(Store);

  private cartService = inject(CartService);


  // =====================================================
  // LOAD CART AFTER LOGIN / AUTH RESTORE
  // =====================================================

  loadCartAfterAuth$ = createEffect(() =>
    this.actions$.pipe(

      ofType(
        loginSuccess,
        restoreAuthSuccess
      ),

      map(() => loadCart())

    )
  );


  // =====================================================
  // RESET CART ON LOGOUT
  // =====================================================

  resetCartOnLogout$ = createEffect(() =>
    this.actions$.pipe(

      ofType(logout),

      map(() => resetCart())

    )
  );


  // =====================================================
  // LOAD CART
  // =====================================================

  loadCart$ = createEffect(() =>
    this.actions$.pipe(

      ofType(loadCart),

      switchMap(() =>
        this.store.select(selectCurrentUser).pipe(

          take(1),

          switchMap(user => {

            // -----------------------------------------
            // NO USER
            // -----------------------------------------

            if (!user) {

              return of(
                loadCartSuccess({
                  items: []
                })
              );

            }


            // -----------------------------------------
            // GET CURRENT USER'S CART
            // -----------------------------------------

            return this.cartService
              .getCart(user.id)
              .pipe(

                map(items => {

                  console.log(
                    'CART LOADED:',
                    items
                  );

                  return loadCartSuccess({
                    items
                  });

                }),

                catchError(error => {

                  console.error(
                    'LOAD CART ERROR:',
                    error
                  );

                  return of(
                    loadCartFailure({
                      error:
                        error.message ??
                        'Failed to load cart'
                    })
                  );

                })

              );

          })

        )

      )

    )
  );


  // =====================================================
  // ADD TO CART
  // =====================================================

  addToCart$ = createEffect(() =>
    this.actions$.pipe(

      ofType(addToCart),

      switchMap(({ product, size, color }) =>

        this.store.select(selectCurrentUser).pipe(

          take(1),

          switchMap(user => {

            // -----------------------------------------
            // USER NOT LOGGED IN
            // -----------------------------------------

            if (!user) {

              console.error(
                'Cannot add to cart: user not logged in'
              );

              return of(
                loadCartFailure({
                  error:
                    'You must be logged in to add items to cart'
                })
              );

            }


            // -----------------------------------------
            // GET USER'S EXISTING CART
            // -----------------------------------------

            return this.cartService
              .getCart(user.id)
              .pipe(

                switchMap(cartItems => {

                  // -----------------------------------
                  // FIND EXISTING ITEM
                  // -----------------------------------

                  const existingItem =
                    cartItems.find(
                      item =>
                        item.productId === product.id &&
                        item.size === size &&
                        item.color === color
                    );


                  // -----------------------------------
                  // EXISTING ITEM
                  // -----------------------------------

                  if (existingItem) {

                    console.log(
                      'CART ITEM EXISTS. INCREASING QUANTITY.'
                    );


                    return this.cartService
                      .updateCartItem(
                        existingItem.id!,
                        existingItem.quantity + 1
                      )
                      .pipe(

                        switchMap(() =>
                          of(loadCart())
                        )

                      );

                  }


                  // -----------------------------------
                  // NEW ITEM
                  // -----------------------------------

                  const newCartItem: CartItem = {

                    id:
                      `${product.id}-${size}-${color}`,

                    userId:
                      user.id,

                    productId:
                      product.id,

                    size,

                    color,

                    quantity: 1

                  };


                  console.log(
                    'ADDING NEW CART ITEM:',
                    newCartItem
                  );


                  return this.cartService
                    .addCartItem(newCartItem)
                    .pipe(

                      switchMap(() =>
                        of(loadCart())
                      )

                    );

                }),

                catchError(error => {

                  console.error(
                    'ADD TO CART ERROR:',
                    error
                  );

                  return of(
                    loadCartFailure({
                      error:
                        error.message ??
                        'Failed to add item to cart'
                    })
                  );

                })

              );

          })

        )

      )

    )
  );


  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  increaseQuantity$ = createEffect(() =>
    this.actions$.pipe(

      ofType(increaseQuantity),

      // IMPORTANT:
      // Action property is cartItemId, NOT id
      switchMap(({ cartItemId }) =>

        this.store.select(selectCurrentUser).pipe(

          take(1),

          switchMap(user => {

            // -----------------------------------------
            // NO USER
            // -----------------------------------------

            if (!user) {

              return of(
                loadCartSuccess({
                  items: []
                })
              );

            }


            // -----------------------------------------
            // GET USER CART
            // -----------------------------------------

            return this.cartService
              .getCart(user.id)
              .pipe(

                switchMap(cartItems => {

                  const item =
                    cartItems.find(
                      cartItem =>
                        cartItem.id === cartItemId
                    );


                  // -----------------------------------
                  // ITEM NOT FOUND
                  // -----------------------------------

                  if (!item) {

                    return of(
                      loadCart()
                    );

                  }


                  // -----------------------------------
                  // INCREASE QUANTITY
                  // -----------------------------------

                  return this.cartService
                    .updateCartItem(
                      item.id!,
                      item.quantity + 1
                    )
                    .pipe(

                      switchMap(() =>
                        of(loadCart())
                      )

                    );

                }),

                catchError(error => {

                  console.error(
                    'INCREASE QUANTITY ERROR:',
                    error
                  );

                  return of(
                    loadCartFailure({
                      error:
                        error.message ??
                        'Failed to increase quantity'
                    })
                  );

                })

              );

          })

        )

      )

    )
  );


  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  decreaseQuantity$ = createEffect(() =>
    this.actions$.pipe(

      ofType(decreaseQuantity),

      // IMPORTANT:
      // Action property is cartItemId, NOT id
      switchMap(({ cartItemId }) =>

        this.store.select(selectCurrentUser).pipe(

          take(1),

          switchMap(user => {

            // -----------------------------------------
            // NO USER
            // -----------------------------------------

            if (!user) {

              return of(
                loadCartSuccess({
                  items: []
                })
              );

            }


            // -----------------------------------------
            // GET USER CART
            // -----------------------------------------

            return this.cartService
              .getCart(user.id)
              .pipe(

                switchMap(cartItems => {

                  const item =
                    cartItems.find(
                      cartItem =>
                        cartItem.id === cartItemId
                    );


                  // -----------------------------------
                  // ITEM NOT FOUND
                  // -----------------------------------

                  if (!item) {

                    return of(
                      loadCart()
                    );

                  }


                  // -----------------------------------
                  // QUANTITY > 1
                  // -----------------------------------

                  if (item.quantity > 1) {

                    return this.cartService
                      .updateCartItem(
                        item.id!,
                        item.quantity - 1
                      )
                      .pipe(

                        switchMap(() =>
                          of(loadCart())
                        )

                      );

                  }


                  // -----------------------------------
                  // QUANTITY = 1
                  // DELETE ITEM
                  // -----------------------------------

                  return this.cartService
                    .removeCartItem(item.id!)
                    .pipe(

                      switchMap(() =>
                        of(loadCart())
                      )

                    );

                }),

                catchError(error => {

                  console.error(
                    'DECREASE QUANTITY ERROR:',
                    error
                  );

                  return of(
                    loadCartFailure({
                      error:
                        error.message ??
                        'Failed to decrease quantity'
                    })
                  );

                })

              );

          })

        )

      )

    )
  );


  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  removeFromCart$ = createEffect(() =>
    this.actions$.pipe(

      ofType(removeFromCart),

      // IMPORTANT:
      // Action property is cartItemId, NOT id
      switchMap(({ cartItemId }) =>

        this.cartService
          .removeCartItem(cartItemId)
          .pipe(

            tap(() => {

              console.log(
                'CART ITEM REMOVED:',
                cartItemId
              );

            }),

            switchMap(() =>
              of(loadCart())
            ),

            catchError(error => {

              console.error(
                'REMOVE FROM CART ERROR:',
                error
              );

              return of(
                loadCartFailure({
                  error:
                    error.message ??
                    'Failed to remove cart item'
                })
              );

            })

          )

      )

    )
  );


  // =====================================================
  // CLEAR CART
  // =====================================================

// =====================================================
// CLEAR CART
// =====================================================

  clearCart$ = createEffect(() =>
    this.actions$.pipe(

      ofType(clearCart),

      switchMap(() =>
        this.store.select(selectCurrentUser).pipe(

          take(1),

          switchMap(user => {

            // -----------------------------------------
            // NO USER
            // -----------------------------------------

            if (!user) {

              return of(
                loadCartSuccess({
                  items: []
                })
              );

            }


            // -----------------------------------------
            // GET CURRENT USER'S CART
            // -----------------------------------------

            return this.cartService
              .getCart(user.id)
              .pipe(

                switchMap(cartItems => {

                  // -----------------------------------
                  // CART ALREADY EMPTY
                  // -----------------------------------

                  if (cartItems.length === 0) {

                    return of(
                      loadCartSuccess({
                        items: []
                      })
                    );

                  }


                  console.log(
                    'CLEARING CART FROM BACKEND:',
                    cartItems
                  );


                  // -----------------------------------
                  // DELETE ALL CART ITEMS
                  // -----------------------------------

                  return forkJoin(
                    cartItems.map(item =>
                      this.cartService.removeCartItem(
                        item.id!
                      )
                    )
                  ).pipe(

                    tap(() => {

                      console.log(
                        'ALL CART ITEMS DELETED FROM BACKEND'
                      );

                    }),

                    // ---------------------------------
                    // DO NOT CALL loadCart()
                    // ---------------------------------
                    //
                    // Directly update NgRx state.
                    //
                    // ---------------------------------

                    map(() =>
                      loadCartSuccess({
                        items: []
                      })
                    )

                  );

                }),

                catchError(error => {

                  console.error(
                    'CLEAR CART ERROR:',
                    error
                  );

                  return of(
                    loadCartFailure({
                      error:
                        error.message ??
                        'Failed to clear cart'
                    })
                  );

                })

              );

          })

        )
      )

    )
  );
}