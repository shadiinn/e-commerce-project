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
  cancelOrderFailure
} from './orders.actions';

import { clearCart } from '../cart/cart.actions';
import { clearCheckout } from '../checkout/checkout.actions';

import { Order } from '../../core/models/order.model';

import { generateOrderNumber }
  from '../../core/utils/order-number.generate';
import { Store } from '@ngrx/store';
import { selectCheckoutMode } from '../checkout/checkout.selectors';


@Injectable()
export class OrdersEffects {

  private actions$ = inject(Actions);

  private store = inject(Store);

  private orderService = inject(OrderService);

  private productService = inject(ProductService);

  private router = inject(Router);


  // =====================================================
  // LOAD ORDERS
  // =====================================================

  loadOrders$ = createEffect(() =>
    this.actions$.pipe(

      ofType(loadOrders),

      switchMap(() =>
        this.orderService.getOrders().pipe(

          map(orders => {

            console.log(
              'ORDERS LOADED from backend:',
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

        )
      )

    )
  );


  // =====================================================
  // PLACE ORDER
  // =====================================================

  placeOrder$ = createEffect(() =>
    this.actions$.pipe(

      // -----------------------------------------------
      // LISTEN FOR PLACE ORDER ACTION
      // -----------------------------------------------

      ofType(placeOrder),

      tap(({ request }) => {

        console.log(
          '🔥 PLACE ORDER EFFECT TRIGGERED'
        );

        console.log(
          '🔥 ORDER REQUEST RECEIVED:',
          request
        );

      }),

      // -----------------------------------------------
      // GET EXISTING ORDERS
      // -----------------------------------------------

      switchMap(({ request }) =>

        this.orderService
          .getOrders()
          .pipe(

            tap(existingOrders => {

              console.log(
                'EXISTING ORDERS:',
                existingOrders
              );

            }),

            // -----------------------------------------
            // GET PRODUCTS
            // -----------------------------------------

            switchMap(existingOrders =>

              this.productService
                .getProducts()
                .pipe(

                  tap(products => {

                    console.log(
                      'PRODUCTS LOADED FOR ORDER:',
                      products
                    );

                  }),

                  // -----------------------------------
                  // BUILD ORDER
                  // -----------------------------------

                  map(products => {

                    console.log(
                      'BUILDING ORDER...'
                    );

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


                        return {

                          productId:
                            product.id,

                          name:
                            product.name,

                          image:
                            product.images[0],

                          size:
                            item.size,

                          color:
                            item.color,

                          quantity:
                            item.quantity,

                          price:
                            product.price,

                          total:
                            product.price *
                            item.quantity

                        };

                      });


                    // ---------------------------------
                    // CALCULATE SUBTOTAL
                    // ---------------------------------

                    const subtotal =
                      orderItems.reduce(
                        (total, item) =>
                          total + item.total,
                        0
                      );


                    // ---------------------------------
                    // CREATE ORDER
                    // ---------------------------------

                    const order: Order = {

                      id:
                        crypto.randomUUID(),

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
                        new Date().toISOString()

                    };


                    console.log(
                      'ORDER CREATED:',
                      order
                    );


                    return order;

                  }),

                  // -----------------------------------
                  // POST ORDER
                  // -----------------------------------

                  switchMap(order => {

                    console.log(
                      'POSTING ORDER TO BACKEND...'
                    );

                    return this.orderService
                      .createOrder(order)
                      .pipe(

                        tap(createdOrder => {

                          console.log(
                            'ORDER CREATED SUCCESSFULLY:',
                            createdOrder
                          );

                        }),

                        map(createdOrder =>
                          placeOrderSuccess({
                            order: createdOrder
                          })
                        )

                      );

                  })

                )

            ),

            // -----------------------------------------
            // HANDLE ERRORS
            // -----------------------------------------

            catchError(error => {

              console.error(
                '❌ PLACE ORDER ERROR:',
                error
              );

              return of(
                placeOrderFailure({
                  error:
                    error.message ??
                    'Failed to place order'
                })
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

          switchMap(mode => {

            if (mode === 'cart') {

              return [
                clearCart(),
                clearCheckout()
              ];

            }

            if (mode === 'buy-now') {

              return [
                clearCheckout()
              ];

            }

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

      switchMap(({ id }) =>

        this.orderService
          .getOrder(id)
          .pipe(

            map(order => {

              console.log(
                'ORDER LOADED:',
                order
              );

              return loadOrderByIdSuccess({
                order
              });

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

          )

      )

    )
  );
  //cancel order

  cancelOrder$ = createEffect(() =>
    this.actions$.pipe(

      ofType(cancelOrder),

      switchMap(({ id }) =>
        this.orderService.updateOrder(
          id,
          {
            orderStatus: 'cancelled'
          }
        ).pipe(

          map(order =>
            cancelOrderSuccess({
              order
            })
          ),

          catchError(error =>
            of(
              cancelOrderFailure({
                error:
                  error.message ??
                  'Failed to cancel order'
              })
            )
          )

        )
      )

    )
  );

}