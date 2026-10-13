import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { Observable, catchError, exhaustMap, filter, forkJoin, map, of, switchMap, take, tap, throwError } from 'rxjs';

import { AuthUser } from '../../core/models/auth-user.model';
import { CreateOrderRequest, Order, OrderItem } from '../../core/models/order.model';
import { Product } from '../../core/models/product.model';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { generateOrderNumber } from '../../core/utils/order-number.generate';

import { loginSuccess, logout, restoreAuthSuccess } from '../auth/auth.actions';
import { selectCurrentUser } from '../auth/auth.selectors';
import { clearCart } from '../cart/cart.actions';
import { clearCheckout } from '../checkout/checkout.actions';
import { selectCheckoutMode } from '../checkout/checkout.selectors';
import { loadProducts } from '../products/products.actions';
import {
  cancelOrder,
  cancelOrderFailure,
  cancelOrderSuccess,
  loadOrderById,
  loadOrderByIdFailure,
  loadOrderByIdSuccess,
  loadOrders,
  loadOrdersFailure,
  loadOrdersSuccess,
  placeOrder,
  placeOrderFailure,
  placeOrderSuccess,
  resetOrders
} from './orders.actions';

/*
  STOCK AND ORDERS
  ----------------
  Placing an order TAKES the pieces out of the stock.
  Cancelling an order PUTS them back.   (ProductService.adjustStock does both)

  Placing an order, step by step:
    1. get the user's orders (for the order number) and the products (for the stock)
    2. build the order (a readable error is thrown when something is wrong)
    3. take the pieces out of the stock
    4. save the order. If saving fails, the pieces are given back.

  An order that took stock is saved with  stockReduced: true.  Only such orders give the
  stock back when they are cancelled. (Older orders never took stock, so cancelling them
  must not add stock.)
*/
@Injectable()
export class OrdersEffects {

  private actions$ = inject(Actions);
  private store = inject(Store);
  private orderService = inject(OrderService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private toast = inject(ToastService);


  // ===================================================================
  // 1. LOGIN AND LOGOUT
  // ===================================================================

  // Logged in (or the saved login was restored) -> load the user's orders
  loadOrdersAfterAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess, restoreAuthSuccess),
      filter(({ user }) => user?.role !== 'admin'),
      map(() => loadOrders())
    )
  );

  // Logged out -> forget the orders on the screen
  resetOrdersOnLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      map(() => resetOrders())
    )
  );


  // ===================================================================
  // 2. LOADING ORDERS
  // ===================================================================

  loadOrders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadOrders),
      switchMap(() =>
        this.store.select(selectCurrentUser).pipe(
          take(1),
          switchMap((user): Observable<Action> => {
            // nobody logged in -> no orders
            if (!user) {
              return of(loadOrdersSuccess({ orders: [] }));
            }

            return this.orderService.getOrders(user.id).pipe(
              map(orders => loadOrdersSuccess({ orders }))
            );
          }),
          catchError(() => of(loadOrdersFailure({ error: 'Failed to load orders.' })))
        )
      )
    )
  );

  // One order. A user may only open their OWN orders.
  loadOrderById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadOrderById),
      switchMap(({ id }) =>
        this.store.select(selectCurrentUser).pipe(
          take(1),
          switchMap((user): Observable<Action> => {
            if (!user) {
              return of(loadOrderByIdFailure({ error: 'You must be logged in to view this order.' }));
            }

            return this.orderService.getOrder(id).pipe(
              map(order =>
                order.userId === user.id
                  ? loadOrderByIdSuccess({ order })
                  : loadOrderByIdFailure({ error: 'Order not found' })
              )
            );
          }),
          catchError(() => of(loadOrderByIdFailure({ error: 'Failed to load the order.' })))
        )
      )
    )
  );


  // ===================================================================
  // 3. PLACING AN ORDER
  // ===================================================================

  // Builds the order from the checkout request and the CURRENT products.
  // It throws an Error with a readable message when an item cannot be bought.
  private buildOrder(
    user: AuthUser,
    request: CreateOrderRequest,
    existingOrders: Order[],
    products: Product[]
  ): Order {

    const items: OrderItem[] = request.items.map(item => {
      const product = products.find(candidate => candidate.id === item.productId);
      if (!product) {
        throw new Error('One of the products is no longer available.');
      }

      const variant = product.variants.find(candidate => candidate.id === item.variantId);
      const size = variant?.sizes.find(candidate => candidate.size === item.size);
      if (!variant || !size) {
        throw new Error(`${product.name} is no longer available in this colour or size.`);
      }

      // enough stock?
      if (item.quantity > size.stock) {
        throw new Error(
          size.stock === 0
            ? `${product.name} (${variant.color}, ${item.size}) is out of stock.`
            : `Only ${size.stock} left of ${product.name} (${variant.color}, ${item.size}).`
        );
      }

      // a copy of the product data: later price changes must not change this order
      return {
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        image: variant.images[0],
        color: variant.color,
        size: item.size,
        quantity: item.quantity,
        price: product.price,
        total: product.price * item.quantity
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    // Check every order, not only this customer's orders, before using a number.
    let orderNumber = generateOrderNumber();
    while (existingOrders.some(order => order.orderNumber === orderNumber)) {
      orderNumber = generateOrderNumber();
    }

    return {
      id: crypto.randomUUID(),
      userId: user.id,
      orderNumber,
      items,
      subtotal,
      shipping: 0,
      total: subtotal,
      shippingAddress: request.shippingAddress,
      paymentMethod: request.paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'confirmed',
      createdAt: new Date().toISOString(),
      stockReduced: true
    };
  }

  placeOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(placeOrder),
      exhaustMap(({ request }) =>
        this.store.select(selectCurrentUser).pipe(
          take(1),
          switchMap((user): Observable<Action> => {

            if (!user) {
              return of(placeOrderFailure({ error: 'You must be logged in to place an order.' }));
            }

            // Step 1: load ALL orders (for a global number collision check) and products.
            return forkJoin({
              existingOrders: this.orderService.getAllOrders(),
              products: this.productService.getProducts()
            }).pipe(

              // Step 2: build the order
              map(({ existingOrders, products }) => this.buildOrder(user, request, existingOrders, products)),

              // Step 3: take the stock, then Step 4: save the order
              switchMap(order =>
                this.productService.adjustStock(order.items, -1).pipe(
                  switchMap(() =>
                    this.orderService.createOrder(order).pipe(
                      // saving failed -> give the stock back, then report the error
                      catchError(error =>
                        this.productService.adjustStock(order.items, 1).pipe(
                          catchError(() => of(null)),
                          switchMap(() => throwError(() => error))
                        )
                      )
                    )
                  )
                )
              ),

              map(createdOrder => placeOrderSuccess({ order: createdOrder })),

              // any error above (invalid item, no stock, request failed) ends up here
              catchError(error =>
                of(placeOrderFailure({ error: error.message ?? 'Failed to place the order.' }))
              )
            );
          })
        )
      )
    )
  );

  // Order placed: clear the cart (only when the order came from the cart) and the checkout
  clearCheckoutAfterOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(placeOrderSuccess),
      switchMap(() =>
        this.store.select(selectCheckoutMode).pipe(
          take(1),
          // "buy now" must keep the cart as it is
          map(mode => (mode === 'cart' ? [clearCart(), clearCheckout()] : [clearCheckout()])),
          switchMap(actions => actions)
        )
      )
    )
  );

  // Order placed: show the confirmation page
  navigateAfterOrder$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(placeOrderSuccess),
        tap(({ order }) => this.router.navigate(['/order-confirmation', order.id]))
      ),
    { dispatch: false }
  );

  // The order could not be placed (for example the stock ran out): tell the customer
  placeOrderFailureToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(placeOrderFailure),
        tap(({ error }) => this.toast.error(error))
      ),
    { dispatch: false }
  );


  // ===================================================================
  // 4. CANCELLING AN ORDER (by the customer)
  // ===================================================================

  // Steps: the order must be the user's own and still cancellable -> mark it cancelled ->
  // give the pieces back to the stock (only when the order took them)
  cancelOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(cancelOrder),
      switchMap(({ id, reason }) =>
        this.store.select(selectCurrentUser).pipe(
          take(1),
          switchMap((user): Observable<Action> => {

            if (!user) {
              return of(cancelOrderFailure({ error: 'You must be logged in to cancel an order.' }));
            }

            if (!reason?.trim()) {
              return of(cancelOrderFailure({ error: 'Please choose a cancellation reason.' }));
            }

            return this.orderService.getOrder(id).pipe(
              switchMap((order): Observable<Action> => {

                if (order.userId !== user.id) {
                  return of(cancelOrderFailure({ error: 'Order not found' }));
                }

                // an order that is shipped (or finished) can no longer be cancelled
                if (order.orderStatus !== 'confirmed') {
                  return of(cancelOrderFailure({ error: 'This order can no longer be cancelled.' }));
                }

                return this.orderService.updateOrder(id, {
                  orderStatus: 'cancelled',
                  cancellationReason: reason,
                  cancelledBy: 'customer'
                }).pipe(
                  switchMap(updatedOrder => {
                    // give the pieces back (a failure here must not hide that the order is cancelled)
                    const restoreStock$ = order.stockReduced
                      ? this.productService.adjustStock(order.items, 1).pipe(
                          catchError(error => {
                            console.error('Could not give the stock back:', error);
                            return of(null);
                          })
                        )
                      : of(null);

                    return restoreStock$.pipe(map(() => cancelOrderSuccess({ order: updatedOrder })));
                  })
                );
              })
            );
          }),
          catchError(() => of(cancelOrderFailure({ error: 'Failed to cancel the order.' })))
        )
      )
    )
  );

  cancelOrderSuccessToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(cancelOrderSuccess),
        tap(() => this.toast.success('Order cancelled'))
      ),
    { dispatch: false }
  );

  cancelOrderFailureToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(cancelOrderFailure),
        tap(({ error }) => this.toast.error(error))
      ),
    { dispatch: false }
  );


  // ===================================================================
  // 5. THE SHOP MUST SHOW THE NEW STOCK
  // ===================================================================

  // Stock changed (order placed or cancelled) -> load the products again, so the shop,
  // the cart limits and the product pages use the new numbers
  reloadProductsAfterStockChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(placeOrderSuccess, cancelOrderSuccess),
      map(() => loadProducts())
    )
  );
}