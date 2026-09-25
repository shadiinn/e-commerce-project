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
  resetCart,
  loadGuestCart,
  loadGuestCartSuccess,
  addGuestCartItem,
  increaseGuestQuantity,
  decreaseGuestQuantity,
  removeGuestItem,
  clearGuestCart,
  mergeGuestCart,
  mergeGuestCartFailure,
  mergeGuestCartSuccess
} from './cart.actions';

import {
  loginSuccess,
  logout,
  restoreAuthSuccess
} from '../auth/auth.actions';

import {
  selectCurrentUser
} from '../auth/auth.selectors';

import { CartItem } from '../../core/models/cart.model';

import {
  GuestCartService
} from '../../core/services/guest-cart.service';


@Injectable()
export class CartEffects {

  private actions$ =
    inject(Actions);

  private store =
    inject(Store);

  private cartService =
    inject(CartService);

  private guestCartService =
    inject(GuestCartService);


  // =====================================================
  // LOAD CART AFTER LOGIN / AUTH RESTORE
  // =====================================================

  loadCartAfterAuth$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(
          loginSuccess,
          restoreAuthSuccess
        ),

        map(() =>
          loadCart()
        )

      )

    );


  // =====================================================
  // RESET CART ON LOGOUT
  // =====================================================

  resetCartOnLogout$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(logout),

        map(() =>
          resetCart()
        )

      )

    );


  // =====================================================
  // LOAD CART
  // =====================================================

  loadCart$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(loadCart),

        switchMap(() =>

          this.store
            .select(selectCurrentUser)
            .pipe(

              take(1),

              switchMap(user => {


                // ---------------------------------------
                // NO USER
                // ---------------------------------------

                if (!user) {

                  return of(

                    loadCartSuccess({

                      items: []

                    })

                  );

                }


                // ---------------------------------------
                // GET CURRENT USER'S CART
                // ---------------------------------------

                return this.cartService
                  .getCart(user.id)
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

                  );

              })

            )

        )

      )

    );


  // =====================================================
  // ADD TO CART
  // =====================================================

  addToCart$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(addToCart),

        switchMap(({ product, size }) =>

          this.store
            .select(selectCurrentUser)
            .pipe(

              take(1),

              switchMap(user => {


                // ---------------------------------------
                // USER NOT LOGGED IN
                // ---------------------------------------

                if (!user) {

                  return of(

                    loadCartFailure({

                      error:
                        'You must be logged in to add items to cart'

                    })

                  );

                }


                // ---------------------------------------
                // GET USER'S EXISTING CART
                // ---------------------------------------

                return this.cartService
                  .getCart(user.id)
                  .pipe(

                    switchMap(cartItems => {


                      // ---------------------------------
                      // FIND EXISTING ITEM
                      // ---------------------------------

                      const existingItem =
                        cartItems.find(

                          item =>

                            item.productId ===
                              product.id &&

                            item.size ===
                              size

                        );


                      // ---------------------------------
                      // EXISTING ITEM
                      // ---------------------------------

                      if (existingItem) {

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


                      // ---------------------------------
                      // NEW ITEM
                      // ---------------------------------

                      const newCartItem:
                        CartItem = {

                        id:
                          `${product.id}-${size}`,

                        userId:
                          user.id,

                        productId:
                          product.id,

                        size,

                        quantity: 1

                      };


                      return this.cartService
                        .addCartItem(
                          newCartItem
                        )
                        .pipe(

                          switchMap(() =>
                            of(loadCart())
                          )

                        );

                    }),

                    catchError(error =>

                      of(

                        loadCartFailure({

                          error:
                            error.message ??
                            'Failed to add item to cart'

                        })

                      )

                    )

                  );

              })

            )

        )

      )

    );


  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  increaseQuantity$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(increaseQuantity),

        switchMap(({ cartItemId }) =>

          this.store
            .select(selectCurrentUser)
            .pipe(

              take(1),

              switchMap(user => {


                if (!user) {

                  return of(

                    loadCartSuccess({

                      items: []

                    })

                  );

                }


                // ---------------------------------------
                // GET USER CART
                // ---------------------------------------

                return this.cartService
                  .getCart(user.id)
                  .pipe(

                    switchMap(cartItems => {

                      const item =
                        cartItems.find(

                          cartItem =>
                            cartItem.id ===
                            cartItemId

                        );


                      // ---------------------------------
                      // ITEM NOT FOUND
                      // ---------------------------------

                      if (!item) {

                        return of(
                          loadCart()
                        );

                      }


                      // ---------------------------------
                      // INCREASE QUANTITY
                      // ---------------------------------

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

                    catchError(error =>

                      of(

                        loadCartFailure({

                          error:
                            error.message ??
                            'Failed to increase quantity'

                        })

                      )

                    )

                  );

              })

            )

        )

      )

    );


  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  decreaseQuantity$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(decreaseQuantity),

        switchMap(({ cartItemId }) =>

          this.store
            .select(selectCurrentUser)
            .pipe(

              take(1),

              switchMap(user => {


                if (!user) {

                  return of(

                    loadCartSuccess({

                      items: []

                    })

                  );

                }


                return this.cartService
                  .getCart(user.id)
                  .pipe(

                    switchMap(cartItems => {

                      const item =
                        cartItems.find(

                          cartItem =>
                            cartItem.id ===
                            cartItemId

                        );


                      if (!item) {

                        return of(
                          loadCart()
                        );

                      }


                      // ---------------------------------
                      // QUANTITY > 1
                      // ---------------------------------

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


                      // ---------------------------------
                      // QUANTITY = 1
                      // DELETE ITEM
                      // ---------------------------------

                      return this.cartService
                        .removeCartItem(
                          item.id!
                        )
                        .pipe(

                          switchMap(() =>
                            of(loadCart())
                          )

                        );

                    }),

                    catchError(error =>

                      of(

                        loadCartFailure({

                          error:
                            error.message ??
                            'Failed to decrease quantity'

                        })

                      )

                    )

                  );

              })

            )

        )

      )

    );


  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  removeFromCart$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(removeFromCart),

        switchMap(({ cartItemId }) =>

          this.cartService
            .removeCartItem(cartItemId)
            .pipe(

              switchMap(() =>
                of(loadCart())
              ),

              catchError(error =>

                of(

                  loadCartFailure({

                    error:
                      error.message ??
                      'Failed to remove cart item'

                  })

                )

              )

            )

        )

      )

    );


  // =====================================================
  // CLEAR CART
  // =====================================================

  clearCart$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(clearCart),

        switchMap(() =>

          this.store
            .select(selectCurrentUser)
            .pipe(

              take(1),

              switchMap(user => {


                if (!user) {

                  return of(

                    loadCartSuccess({

                      items: []

                    })

                  );

                }


                return this.cartService
                  .getCart(user.id)
                  .pipe(

                    switchMap(cartItems => {


                      // ---------------------------------
                      // CART ALREADY EMPTY
                      // ---------------------------------

                      if (
                        cartItems.length === 0
                      ) {

                        return of(

                          loadCartSuccess({

                            items: []

                          })

                        );

                      }


                      // ---------------------------------
                      // DELETE ALL CART ITEMS
                      // ---------------------------------

                      return forkJoin(

                        cartItems.map(item =>

                          this.cartService
                            .removeCartItem(
                              item.id!
                            )

                        )

                      ).pipe(

                        map(() =>

                          loadCartSuccess({

                            items: []

                          })

                        )

                      );

                    }),

                    catchError(error =>

                      of(

                        loadCartFailure({

                          error:
                            error.message ??
                            'Failed to clear cart'

                        })

                      )

                    )

                  );

              })

            )

        )

      )

    );


  // =====================================================
  // LOAD GUEST CART
  // =====================================================

  loadGuestCart$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(loadGuestCart),

        map(() => {

          const items =
            this.guestCartService.getCart();

          return loadGuestCartSuccess({

            items

          });

        })

      )

    );


  // =====================================================
  // ADD GUEST CART ITEM
  // =====================================================

  addGuestCartItem$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(addGuestCartItem),

        tap(({ productId, size }) => {

          this.guestCartService.addItem({

            id:
              `${productId}-${size}`,

            productId,

            size,

            quantity: 1

          });

        }),

        map(() =>
          loadGuestCart()
        )

      )

    );


  // =====================================================
  // INCREASE GUEST QUANTITY
  // =====================================================

  increaseGuestQuantity$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(increaseGuestQuantity),

        tap(({ cartItemId }) => {

          const cart =
            this.guestCartService.getCart();

          const item =
            cart.find(
              item =>
                item.id === cartItemId
            );


          if (!item) {

            return;

          }


          this.guestCartService.updateQuantity(

            cartItemId,

            item.quantity + 1

          );

        }),

        map(() =>
          loadGuestCart()
        )

      )

    );


  // =====================================================
  // DECREASE GUEST QUANTITY
  // =====================================================

  decreaseGuestQuantity$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(decreaseGuestQuantity),

        tap(({ cartItemId }) => {

          const cart =
            this.guestCartService.getCart();

          const item =
            cart.find(
              item =>
                item.id === cartItemId
            );


          if (!item) {

            return;

          }


          this.guestCartService.updateQuantity(

            cartItemId,

            item.quantity - 1

          );

        }),

        map(() =>
          loadGuestCart()
        )

      )

    );


  // =====================================================
  // REMOVE GUEST ITEM
  // =====================================================

  removeGuestItem$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(removeGuestItem),

        tap(({ cartItemId }) => {

          this.guestCartService.removeItem(
            cartItemId
          );

        }),

        map(() =>
          loadGuestCart()
        )

      )

    );


  // =====================================================
  // CLEAR GUEST CART
  // =====================================================

  clearGuestCart$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(clearGuestCart),

        tap(() => {

          this.guestCartService.clearCart();

        }),

        map(() =>
          loadGuestCart()
        )

      )

    );


  // =====================================================
  // MERGE GUEST CART AFTER LOGIN
  // =====================================================

  mergeGuestCart$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(mergeGuestCart),

        switchMap(({ returnUrl }) =>

          this.store
            .select(selectCurrentUser)
            .pipe(

              take(1),

              switchMap(user => {


                // ---------------------------------------
                // NO USER
                // ---------------------------------------

                if (!user) {

                  return of(

                    mergeGuestCartFailure({

                      error:
                        'Cannot merge cart without a logged-in user',

                      returnUrl

                    })

                  );

                }


                // ---------------------------------------
                // GET GUEST CART
                // ---------------------------------------

                const guestItems =
                  this.guestCartService.getCart();


                // ---------------------------------------
                // GUEST CART EMPTY
                // ---------------------------------------

                if (
                  guestItems.length === 0
                ) {

                  return of(

                    mergeGuestCartSuccess({

                      returnUrl

                    })

                  );

                }


                // ---------------------------------------
                // GET USER BACKEND CART
                // ---------------------------------------

                return this.cartService
                  .getCart(user.id)
                  .pipe(

                    switchMap(cartItems => {


                      // ---------------------------------
                      // CREATE REQUEST FOR EACH
                      // GUEST ITEM
                      // ---------------------------------

                      const requests =
                        guestItems.map(
                          guestItem => {


                            const existingItem =
                              cartItems.find(

                                item =>

                                  item.productId ===
                                    guestItem.productId &&

                                  item.size ===
                                    guestItem.size

                              );


                            // ---------------------------
                            // EXISTING ITEM
                            // ---------------------------

                            if (existingItem) {

                              return this.cartService
                                .updateCartItem(

                                  existingItem.id!,

                                  existingItem.quantity +
                                    guestItem.quantity

                                );

                            }


                            // ---------------------------
                            // NEW ITEM
                            // ---------------------------

                            const newCartItem:
                              CartItem = {

                              id:
                                `${guestItem.productId}-${guestItem.size}`,

                              userId:
                                user.id,

                              productId:
                                guestItem.productId,

                              size:
                                guestItem.size,

                              quantity:
                                guestItem.quantity

                            };


                            return this.cartService
                              .addCartItem(
                                newCartItem
                              );

                          }

                        );


                      // ---------------------------------
                      // EXECUTE ALL REQUESTS
                      // ---------------------------------

                      return forkJoin(
                        requests
                      ).pipe(

                        tap(() => {

                          // Clear ONLY after
                          // every request succeeds

                          this.guestCartService
                            .clearCart();

                        }),

                        map(() =>

                          mergeGuestCartSuccess({

                            returnUrl

                          })

                        )

                      );

                    }),

                    catchError(error =>

                      of(

                        mergeGuestCartFailure({

                          error:
                            error.message ??
                            'Failed to merge guest cart',

                          returnUrl

                        })

                      )

                    )

                  );

              })

            )

        )

      )

    );


  // =====================================================
  // LOAD CART AFTER GUEST MERGE
  // =====================================================

  loadCartAfterGuestMerge$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(
          mergeGuestCartSuccess
        ),

        map(() =>
          loadCart()
        )

      )

    );

}