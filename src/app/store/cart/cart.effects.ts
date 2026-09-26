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
  forkJoin,
  map,
  of,
  switchMap,
  take,
  tap
} from 'rxjs';

import {
  Store
} from '@ngrx/store';

import {
  CartService
} from '../../core/services/cart.service';

import {
  GuestCartService
} from '../../core/services/guest-cart.service';

import {
  CartItem
} from '../../core/models/cart.model';

import {
  loadProductsSuccess
} from '../products/products.actions';

import {
  selectProductEntities
} from '../products/products.selectors';

import {
  selectCurrentUser
} from '../auth/auth.selectors';

import {
  loginSuccess,
  logout,
  restoreAuthSuccess
} from '../auth/auth.actions';

import { CART_LIMITS } from '../../core/models/constants/cart.constants';

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
  // LOAD GUEST CART INITIALLY
  // =====================================================

  loadGuestCartAfterAuthRestore$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(
          restoreAuthSuccess,
          logout
        ),

        map(() =>
          loadGuestCart()
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
  // LOAD GUEST CART
  // =====================================================

  loadGuestCart$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(loadGuestCart),

        map(() =>

          loadGuestCartSuccess({
            items:
              this.guestCartService.getCart()
          })

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

        switchMap(({
          product,
          variantId,
          size
        }) =>

          this.store
            .select(selectCurrentUser)
            .pipe(

              take(1),

              switchMap(user => {

                if (!user) {

                  return of(
                    loadCartFailure({
                      error:
                        'You must be logged in to add items to cart'
                    })
                  );

                }


                return this.cartService
                  .getCart(user.id)
                  .pipe(

                    switchMap(cartItems => {

                      const existingItem =
                        cartItems.find(item =>

                          item.productId ===
                            product.id &&

                          item.variantId ===
                            variantId &&

                          item.size ===
                            size

                        );


                      // ---------------------------------
                      // EXISTING CART ITEM
                      // ---------------------------------

                      if (existingItem) {

                        const productQuantity =
                          cartItems

                            .filter(item =>
                              item.productId ===
                              product.id
                            )

                            .reduce(
                              (total, item) =>
                                total +
                                item.quantity,
                              0
                            );


                        if (
                          productQuantity >=
                          CART_LIMITS.MAX_QUANTITY_PER_PRODUCT
                        ) {

                          return of(
                            loadCart()
                          );

                        }


                        return this.cartService
                          .updateCartItem(

                            existingItem.id!,

                            existingItem.quantity + 1

                          )

                          .pipe(

                            switchMap(() =>
                              of(
                                loadCart()
                              )
                            )

                          );

                      }


                      // ---------------------------------
                      // DISTINCT PRODUCT LIMIT
                      // ---------------------------------

                      const distinctProducts =
                        new Set(
                          cartItems.map(
                            item =>
                              item.productId
                          )
                        );


                      if (
                        distinctProducts.size >=
                        CART_LIMITS.MAX_DISTINCT_PRODUCTS
                      ) {

                        return of(
                          loadCart()
                        );

                      }


                      // ---------------------------------
                      // NEW CART ITEM
                      // ---------------------------------

                      const cartItem: CartItem = {

                        id:
                          `${product.id}-${variantId}-${size}`,

                        userId:
                          user.id,

                        productId:
                          product.id,

                        variantId,

                        size,

                        quantity: 1

                      };


                      return this.cartService
                        .addCartItem(cartItem)

                        .pipe(

                          switchMap(() =>
                            of(
                              loadCart()
                            )
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
                    loadCart()
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
                      // MAX PRODUCT QUANTITY
                      // ---------------------------------

                      const productQuantity =
                        cartItems

                          .filter(cartItem =>
                            cartItem.productId ===
                            item.productId
                          )

                          .reduce(
                            (total, cartItem) =>
                              total +
                              cartItem.quantity,
                            0
                          );


                      if (
                        productQuantity >=
                        CART_LIMITS.MAX_QUANTITY_PER_PRODUCT
                      ) {

                        return of(
                          loadCart()
                        );

                      }


                      // ---------------------------------
                      // CHECK VARIANT STOCK
                      // ---------------------------------

                      return this.store
                        .select(selectProductEntities)
                        .pipe(

                          take(1),

                          switchMap(products => {

                            const product =
                              products[item.productId];


                            if (!product) {

                              return of(
                                loadCart()
                              );

                            }


                            const variant =
                              product.variants.find(
                                variant =>
                                  variant.id ===
                                  item.variantId
                              );


                            if (!variant) {

                              return of(
                                loadCart()
                              );

                            }


                            const size =
                              variant.sizes.find(
                                size =>
                                  size.size ===
                                  item.size
                              );


                            if (
                              !size ||
                              item.quantity >=
                              size.stock
                            ) {

                              return of(
                                loadCart()
                              );

                            }


                            return this.cartService
                              .updateCartItem(

                                item.id!,

                                item.quantity + 1

                              )

                              .pipe(

                                switchMap(() =>
                                  of(
                                    loadCart()
                                  )
                                )

                              );

                          })

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
                    loadCart()
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


                      if (
                        item.quantity <= 1
                      ) {

                        return this.cartService
                          .removeCartItem(
                            item.id!
                          )

                          .pipe(

                            switchMap(() =>
                              of(
                                loadCart()
                              )
                            )

                          );

                      }


                      return this.cartService
                        .updateCartItem(

                          item.id!,

                          item.quantity - 1

                        )

                        .pipe(

                          switchMap(() =>
                            of(
                              loadCart()
                            )
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

          this.store
            .select(selectCurrentUser)
            .pipe(

              take(1),

              switchMap(user => {

                if (!user) {

                  return of(
                    loadCart()
                  );

                }


                return this.cartService
                  .removeCartItem(
                    cartItemId
                  )

                  .pipe(

                    switchMap(() =>
                      of(
                        loadCart()
                      )
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

                  );

              })

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

                    switchMap(items => {

                      if (!items.length) {

                        return of(
                          loadCart()
                        );

                      }


                      return forkJoin(

                        items

                          .filter(
                            item =>
                              !!item.id
                          )

                          .map(item =>
                            this.cartService
                              .removeCartItem(
                                item.id!
                              )
                          )

                      )

                      .pipe(

                        switchMap(() =>
                          of(
                            loadCart()
                          )
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
  // ADD GUEST CART ITEM
  // =====================================================

  addGuestCartItem$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(addGuestCartItem),

        tap(({
          productId,
          variantId,
          size
        }) => {

          this.guestCartService.addItem({

            id:
              `${productId}-${variantId}-${size}`,

            productId,

            variantId,

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

        switchMap(({ cartItemId }) =>

          this.store
            .select(selectProductEntities)
            .pipe(

              take(1),

              switchMap(products => {

                const cart =
                  this.guestCartService.getCart();


                const item =
                  cart.find(
                    item =>
                      item.id ===
                      cartItemId
                  );


                if (!item) {

                  return of(
                    loadGuestCart()
                  );

                }


                const productQuantity =
                  cart

                    .filter(cartItem =>
                      cartItem.productId ===
                      item.productId
                    )

                    .reduce(
                      (total, cartItem) =>
                        total +
                        cartItem.quantity,
                      0
                    );


                if (
                  productQuantity >=
                  CART_LIMITS.MAX_QUANTITY_PER_PRODUCT
                ) {

                  return of(
                    loadGuestCart()
                  );

                }


                const product =
                  products[item.productId];


                if (!product) {

                  return of(
                    loadGuestCart()
                  );

                }


                const variant =
                  product.variants.find(
                    variant =>
                      variant.id ===
                      item.variantId
                  );


                const size =
                  variant?.sizes.find(
                    size =>
                      size.size ===
                      item.size
                  );


                if (
                  !size ||
                  item.quantity >=
                  size.stock
                ) {

                  return of(
                    loadGuestCart()
                  );

                }


                this.guestCartService
                  .updateQuantity(

                    cartItemId,

                    item.quantity + 1

                  );


                return of(
                  loadGuestCart()
                );

              })

            )

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
                item.id ===
                cartItemId
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

                if (!user) {

                  return of(
                    mergeGuestCartFailure({

                      error:
                        'Cannot merge cart without a logged-in user',

                      returnUrl

                    })
                  );

                }


                const guestItems =
                  this.guestCartService.getCart();


                if (!guestItems.length) {

                  return of(
                    mergeGuestCartSuccess({
                      returnUrl
                    })
                  );

                }


                return this.cartService
                  .getCart(user.id)
                  .pipe(

                    switchMap(cartItems => {

                      const distinctProducts =
                        new Set(
                          cartItems.map(
                            item =>
                              item.productId
                          )
                        );


                      const requests =
                        guestItems.map(
                          guestItem => {

                            const existingItem =
                              cartItems.find(
                                item =>

                                  item.productId ===
                                    guestItem.productId &&

                                  item.variantId ===
                                    guestItem.variantId &&

                                  item.size ===
                                    guestItem.size

                              );


                            if (existingItem) {

                              const productQuantity =
                                cartItems

                                  .filter(item =>
                                    item.productId ===
                                    guestItem.productId
                                  )

                                  .reduce(
                                    (total, item) =>
                                      total +
                                      item.quantity,
                                    0
                                  );


                              const allowedQuantity =
                                Math.min(

                                  guestItem.quantity,

                                  Math.max(
                                    0,

                                    CART_LIMITS
                                      .MAX_QUANTITY_PER_PRODUCT -
                                    productQuantity

                                  )

                                );


                              if (
                                allowedQuantity <= 0
                              ) {

                                return of(null);

                              }


                              return this.cartService
                                .updateCartItem(

                                  existingItem.id!,

                                  existingItem.quantity +
                                  allowedQuantity

                                );

                            }


                            if (
                              distinctProducts.size >=
                              CART_LIMITS.MAX_DISTINCT_PRODUCTS
                            ) {

                              return of(null);

                            }


                            distinctProducts.add(
                              guestItem.productId
                            );


                            const cartItem: CartItem = {

                              id:
                                `${guestItem.productId}-${guestItem.variantId}-${guestItem.size}`,

                              userId:
                                user.id,

                              productId:
                                guestItem.productId,

                              variantId:
                                guestItem.variantId,

                              size:
                                guestItem.size,

                              quantity:
                                Math.min(
                                  guestItem.quantity,
                                  CART_LIMITS.MAX_QUANTITY_PER_PRODUCT
                                )

                            };


                            return this.cartService
                              .addCartItem(
                                cartItem
                              );

                          }

                        );


                      return forkJoin(
                        requests
                      )

                      .pipe(

                        tap(() => {

                          this.guestCartService
                            .clearCart();

                        }),

                        switchMap(() =>

                          of(
                            mergeGuestCartSuccess({
                              returnUrl
                            })
                          )

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
  // LOAD CART AFTER MERGE
  // =====================================================

  loadCartAfterMerge$ =
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
