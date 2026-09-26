import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import {
  catchError,
  map,
  of,
  switchMap,
  take,
  tap
} from 'rxjs';

import { Store } from '@ngrx/store';

import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';

import {
  loadOrders,
  loadOrdersSuccess,
  loadOrdersFailure,

  placeOrder,
  placeOrderSuccess,
  placeOrderFailure,

  loadOrderById,
  loadOrderByIdSuccess,
  loadOrderByIdFailure,

  cancelOrder,
  cancelOrderSuccess,
  cancelOrderFailure,

  resetOrders
} from './orders.actions';

import {
  loginSuccess,
  logout,
  restoreAuthSuccess
} from '../auth/auth.actions';

import { selectCurrentUser } from '../auth/auth.selectors';

import { clearCart } from '../cart/cart.actions';
import { clearCheckout } from '../checkout/checkout.actions';

import { selectCheckoutMode } from '../checkout/checkout.selectors';

import { Order } from '../../core/models/order.model';

import { generateOrderNumber }
  from '../../core/utils/order-number.generate';


@Injectable()
export class OrdersEffects {

  private actions$ = inject(Actions);

  private store = inject(Store);

  private orderService = inject(OrderService);

  private productService = inject(ProductService);

  private router = inject(Router);


  // =====================================================
  // LOAD ORDERS AFTER LOGIN / AUTH RESTORE
  // =====================================================

  loadOrdersAfterAuth$ = createEffect(() =>
    this.actions$.pipe(

      ofType(
        loginSuccess,
        restoreAuthSuccess
      ),

      map(() => loadOrders())

    )
  );


  // =====================================================
  // RESET ORDERS ON LOGOUT
  // =====================================================

  resetOrdersOnLogout$ = createEffect(() =>
    this.actions$.pipe(

      ofType(logout),

      map(() => resetOrders())

    )
  );


  // =====================================================
  // LOAD ORDERS
  // =====================================================

  loadOrders$ = createEffect(() =>
    this.actions$.pipe(

      ofType(loadOrders),

      switchMap(() =>

        this.store.select(selectCurrentUser).pipe(

          take(1),

          switchMap(user => {

            // ---------------------------------------------
            // NO USER
            // ---------------------------------------------

            if (!user) {

              return of(
                loadOrdersSuccess({
                  orders: []
                })
              );

            }


            // ---------------------------------------------
            // LOAD ONLY CURRENT USER'S ORDERS
            // ---------------------------------------------

            return this.orderService
              .getOrders(user.id)
              .pipe(

                map(orders => {

                  console.log(
                    'USER ORDERS LOADED:',
                    orders
                  );

                  return loadOrdersSuccess({
                    orders
                  });

                }),

                catchError(error => {

                  console.error(
                    'LOAD ORDERS ERROR:',
                    error
                  );

                  return of(
                    loadOrdersFailure({
                      error:
                        error.message ??
                        'Failed to load orders'
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
  // PLACE ORDER
  // =====================================================

  placeOrder$ = createEffect(() =>

    this.actions$.pipe(

      ofType(placeOrder),


      // ===================================================
      // GET CURRENT USER
      // ===================================================

      switchMap(({ request }) =>

        this.store
          .select(selectCurrentUser)
          .pipe(

            take(1),

            switchMap(user => {

              if (!user) {

                return of(

                  placeOrderFailure({

                    error:
                      'You must be logged in to place an order'

                  })

                );

              }


              // =============================================
              // GET EXISTING ORDERS
              // =============================================

              return this.orderService
                .getOrders(user.id)
                .pipe(

                  // =========================================
                  // GET PRODUCTS
                  // =========================================

                  switchMap(existingOrders =>

                    this.productService
                      .getProducts()
                      .pipe(

                        // ===================================
                        // BUILD ORDER
                        // ===================================

                        map(products => {

                          const orderItems =
                            request.items.map(item => {

                              const product =
                                products.find(
                                  product =>
                                    product.id ===
                                    item.productId
                                );


                              if (!product) {

                                throw new Error(
                                  `Product ${item.productId} not found`
                                );

                              }


                              const variant =
                                product.variants.find(
                                  variant =>
                                    variant.id ===
                                    item.variantId
                                );


                              if (!variant) {

                                throw new Error(

                                  `Variant ${item.variantId} not found for product ${product.id}`

                                );

                              }


                              const size =
                                variant.sizes.find(
                                  size =>
                                    size.size ===
                                    item.size
                                );


                              if (!size) {

                                throw new Error(

                                  `Size ${item.size} not found for variant ${variant.id}`

                                );

                              }


                              // ---------------------------------
                              // STOCK VALIDATION
                              // ---------------------------------

                              if (
                                item.quantity >
                                size.stock
                              ) {

                                throw new Error(

                                  `${product.name} (${variant.color}, ${item.size}) does not have enough stock`

                                );

                              }


                              // ---------------------------------
                              // CREATE ORDER ITEM
                              // ---------------------------------

                              return {

                                productId:
                                  product.id,

                                variantId:
                                  variant.id,

                                name:
                                  product.name,

                                image:
                                  variant.images[0],

                                color:
                                  variant.color,

                                size:
                                  item.size,

                                quantity:
                                  item.quantity,

                                price:
                                  product.price,

                                total:
                                  product.price *
                                  item.quantity

                              };

                            });


                          // =================================
                          // CALCULATE SUBTOTAL
                          // =================================

                          const subtotal =
                            orderItems.reduce(

                              (total, item) =>

                                total +
                                item.total,

                              0

                            );


                          // =================================
                          // CREATE ORDER
                          // =================================

                          const order:
                            Order = {

                            id:
                              crypto.randomUUID(),

                            userId:
                              user.id,

                            orderNumber:
                              generateOrderNumber(
                                existingOrders
                              ),

                            items:
                              orderItems,

                            subtotal,

                            shipping:
                              0,

                            total:
                              subtotal,

                            shippingAddress:
                              request.shippingAddress,

                            paymentMethod:
                              request.paymentMethod,

                            paymentStatus:
                              'pending',

                            orderStatus:
                              'confirmed',

                            createdAt:
                              new Date()
                                .toISOString()

                          };


                          return order;

                        }),


                        // ===================================
                        // POST ORDER
                        // ===================================

                        switchMap(order =>

                          this.orderService
                            .createOrder(order)
                            .pipe(

                              map(createdOrder =>

                                placeOrderSuccess({

                                  order:
                                    createdOrder

                                })

                              )

                            )

                        )

                      )

                  ),


                  // =======================================
                  // HANDLE ERRORS
                  // =======================================

                  catchError(error =>

                    of(

                      placeOrderFailure({

                        error:
                          error.message ??
                          'Failed to place order'

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
  // CLEAR CART + CHECKOUT AFTER SUCCESS
  // =====================================================

  clearCheckoutAfterOrder$ = createEffect(() =>
    this.actions$.pipe(

      ofType(placeOrderSuccess),

      switchMap(() =>
        this.store.select(selectCheckoutMode).pipe(

          take(1),

          tap(mode => {

            console.log(
              'CHECKOUT MODE AFTER ORDER:',
              mode
            );

          }),

          switchMap(mode => {

            // -----------------------------------------
            // CART CHECKOUT
            // -----------------------------------------

            if (mode === 'cart') {

              console.log(
                '🛒 CART CHECKOUT → CLEARING CART'
              );

              return [
                clearCart(),
                clearCheckout()
              ];

            }


            // -----------------------------------------
            // BUY NOW
            // -----------------------------------------

            if (mode === 'buy-now') {

              console.log(
                '⚡ BUY NOW → KEEPING EXISTING CART'
              );

              return [
                clearCheckout()
              ];

            }


            // -----------------------------------------
            // UNKNOWN / NULL MODE
            // -----------------------------------------

            console.warn(
              '⚠️ UNKNOWN CHECKOUT MODE:',
              mode
            );

            return [
              clearCheckout()
            ];

          })

        )
      )

    )
  );

  // =====================================================
  // NAVIGATE TO ORDER CONFIRMATION
  // =====================================================

  navigateAfterOrder$ = createEffect(
    () =>
      this.actions$.pipe(

        ofType(placeOrderSuccess),

        tap(({ order }) => {

          console.log(
            'NAVIGATING TO ORDER CONFIRMATION:',
            order.id
          );


          this.router.navigate([
            '/order-confirmation',
            order.id
          ]);

        })

      ),

    {
      dispatch: false
    }
  );


  // =====================================================
  // LOAD SINGLE ORDER
  // =====================================================

  loadOrderById$ = createEffect(() =>
    this.actions$.pipe(

      ofType(loadOrderById),

      // -----------------------------------------------
      // GET CURRENT USER
      // -----------------------------------------------

      switchMap(({ id }) =>

        this.store.select(selectCurrentUser).pipe(

          take(1),

          switchMap(user => {

            // -----------------------------------------
            // NO USER
            // -----------------------------------------

            if (!user) {

              return of(
                loadOrderByIdFailure({
                  error:
                    'You must be logged in to view this order'
                })
              );

            }


            // -----------------------------------------
            // GET ORDER
            // -----------------------------------------

            return this.orderService
              .getOrder(id)
              .pipe(

                switchMap(order => {

                  // -----------------------------------
                  // VERIFY ORDER OWNERSHIP
                  // -----------------------------------

                  if (order.userId !== user.id) {

                    console.error(
                      'ORDER DOES NOT BELONG TO CURRENT USER'
                    );

                    return of(
                      loadOrderByIdFailure({
                        error:
                          'Order not found'
                      })
                    );

                  }


                  console.log(
                    'ORDER LOADED:',
                    order
                  );


                  return of(
                    loadOrderByIdSuccess({
                      order
                    })
                  );

                }),


                catchError(error => {

                  console.error(
                    'LOAD ORDER ERROR:',
                    error
                  );

                  return of(
                    loadOrderByIdFailure({
                      error:
                        error.message ??
                        'Failed to load order'
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
  // CANCEL ORDER
  // =====================================================

  cancelOrder$ = createEffect(() =>
    this.actions$.pipe(

      ofType(cancelOrder),

      // -----------------------------------------------
      // GET CURRENT USER
      // -----------------------------------------------

      switchMap(({ id }) =>

        this.store.select(selectCurrentUser).pipe(

          take(1),

          switchMap(user => {

            // -----------------------------------------
            // NO USER
            // -----------------------------------------

            if (!user) {

              return of(
                cancelOrderFailure({
                  error:
                    'You must be logged in to cancel an order'
                })
              );

            }


            // -----------------------------------------
            // GET ORDER
            // -----------------------------------------

            return this.orderService
              .getOrder(id)
              .pipe(

                switchMap(order => {

                  // -----------------------------------
                  // VERIFY ORDER OWNERSHIP
                  // -----------------------------------

                  if (order.userId !== user.id) {

                    console.error(
                      'CANNOT CANCEL ANOTHER USER ORDER'
                    );

                    return of(
                      cancelOrderFailure({
                        error:
                          'Order not found'
                      })
                    );

                  }


                  // -----------------------------------
                  // UPDATE ORDER STATUS
                  // -----------------------------------

                  return this.orderService
                    .updateOrder(
                      id,
                      {
                        orderStatus: 'cancelled'
                      }
                    )
                    .pipe(

                      map(updatedOrder =>

                        cancelOrderSuccess({
                          order: updatedOrder
                        })

                      )

                    );

                }),


                catchError(error => {

                  console.error(
                    'CANCEL ORDER ERROR:',
                    error
                  );

                  return of(
                    cancelOrderFailure({
                      error:
                        error.message ??
                        'Failed to cancel order'
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