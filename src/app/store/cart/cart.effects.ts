import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { Observable, catchError, forkJoin, map, of, switchMap, take, tap } from 'rxjs';

import { CartService } from '../../core/services/cart.service';
import { GuestCartService } from '../../core/services/guest-cart.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthUser } from '../../core/models/auth-user.model';
import { CartItem } from '../../core/models/cart.model';
import { GuestCartItem } from '../../core/models/guest-cart.model';
import { MAX_PER_ITEM } from '../../core/utils/cart.limits';
import {
  CART_MERGE_TRIMMED_MESSAGE,
  CartLine,
  checkQuantityLimit,
  evaluateAddToCart,
  findCartLine,
  getSizeStock,
  isOverProductLimit,
  quantityLimitMessage
} from '../../core/utils/cart.limits';

import { selectProductEntities } from '../products/products.selectors';
import { selectCurrentUser } from '../auth/auth.selectors';
import { loginSuccess, logout, restoreAuthSuccess } from '../auth/auth.actions';
import {
  addGuestCartItem,
  addToCart,
  clearCart,
  clearGuestCart,
  decreaseGuestQuantity,
  decreaseQuantity,
  increaseGuestQuantity,
  increaseQuantity,
  loadCart,
  loadCartFailure,
  loadCartSuccess,
  loadGuestCart,
  loadGuestCartSuccess,
  mergeGuestCart,
  mergeGuestCartFailure,
  mergeGuestCartSuccess,
  removeFromCart,
  removeGuestItem,
  resetCart
} from './cart.actions';


// A cart row needs an id. Same product + colour + size always gives the same id.
function makeCartItemId(productId: string, variantId: string, size: string): string {
  return `${productId}-${variantId}-${size}`;
}


@Injectable()
export class CartEffects {

  private actions$ = inject(Actions);
  private store = inject(Store);
  private cartService = inject(CartService);
  private guestCartService = inject(GuestCartService);
  private toast = inject(ToastService);


  private products$ = this.store.select(selectProductEntities).pipe(take(1));


  private withLoggedInUser(
    errorMessage: string,
    doRequest: (user: AuthUser) => Observable<Action>
  ): Observable<Action> {
    return this.store.select(selectCurrentUser).pipe(
      take(1),
      switchMap((user): Observable<Action> => {
        if (!user) {
          this.toast.warning('Please log in to use your cart.');
          return of(loadCart());
        }
        return doRequest(user);
      }),
      catchError(() => of(loadCartFailure({ error: errorMessage })))
    );
  }


  private checkCanIncrease(row: CartLine) {
    return this.products$.pipe(
      map(products => {
        const stock = getSizeStock(products[row.productId], row.variantId, row.size);
        const limit = checkQuantityLimit(row.quantity, stock);
        return { limit, stock };
      })
    );
  }


  loadCartAfterAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess, restoreAuthSuccess),
      map(() => loadCart())
    )
  );


  loadGuestCartAfterAuthRestore$ = createEffect(() =>
    this.actions$.pipe(
      ofType(restoreAuthSuccess, logout),
      map(() => loadGuestCart())
    )
  );

  resetCartOnLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      map(() => resetCart())
    )
  );



  loadCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCart),
      switchMap(() =>
        this.store.select(selectCurrentUser).pipe(
          take(1),
          switchMap((user): Observable<Action> => {
            // nobody logged in -> the account cart is empty
            if (!user) {
              return of(loadCartSuccess({ items: [] }));
            }
            return this.cartService.getCart(user.id).pipe(
              map(items => loadCartSuccess({ items }))
            );
          }),
          catchError(() =>
            of(loadCartFailure({ error: 'Could not load your cart. Please try again.' }))
          )
        )
      )
    )
  );

 
  addToCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(addToCart),
      switchMap(({ product, variantId, size }) =>
        this.withLoggedInUser('Could not add the item to your cart. Please try again.', user =>

          
          this.cartService.getCart(user.id).pipe(
            switchMap((cartItems): Observable<Action> => {

              
              const stock = getSizeStock(product, variantId, size);
              const check = evaluateAddToCart(cartItems, product.id, variantId, size, stock);

              if (!check.allowed) {
                this.toast.warning(check.message);
                return of(loadCart());
              }

              
              const existingRow = findCartLine(cartItems, product.id, variantId, size);

              if (existingRow) {
                return this.cartService
                  .updateCartItem(existingRow.id!, existingRow.quantity + 1)
                  .pipe(map(() => loadCart()));
              }

              
              return this.cartService
                .addCartItem({
                  id: makeCartItemId(product.id, variantId, size),
                  userId: user.id,
                  productId: product.id,
                  variantId,
                  size,
                  quantity: 1
                })
                .pipe(map(() => loadCart()));
            })
          )
        )
      )
    )
  );

  increaseQuantity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(increaseQuantity),
      switchMap(({ cartItemId }) =>
        this.withLoggedInUser('Could not update the quantity. Please try again.', user =>

          
          this.cartService.getCart(user.id).pipe(
            switchMap((cartItems): Observable<Action> => {
              const row = cartItems.find(item => item.id === cartItemId);

              if (!row) {
                return of(loadCart());
              }

           
              return this.checkCanIncrease(row).pipe(
                switchMap(({ limit, stock }): Observable<Action> => {

                  if (limit !== 'OK') {
                    this.toast.warning(quantityLimitMessage(limit, stock));
                    return of(loadCart());
                  }

                  return this.cartService
                    .updateCartItem(cartItemId, row.quantity + 1)
                    .pipe(map(() => loadCart()));
                })
              );
            })
          )
        )
      )
    )
  );

  // "-" button
  decreaseQuantity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(decreaseQuantity),
      switchMap(({ cartItemId }) =>
        this.withLoggedInUser('Could not update the quantity. Please try again.', user =>

          this.cartService.getCart(user.id).pipe(
            switchMap((cartItems): Observable<Action> => {
              const row = cartItems.find(item => item.id === cartItemId);

              if (!row) {
                return of(loadCart());
              }

              // quantity is 1 -> "-" deletes the row
              if (row.quantity <= 1) {
                return this.cartService.removeCartItem(cartItemId).pipe(map(() => loadCart()));
              }

              // otherwise quantity - 1
              return this.cartService
                .updateCartItem(cartItemId, row.quantity - 1)
                .pipe(map(() => loadCart()));
            })
          )
        )
      )
    )
  );

  // "Remove" link
  removeFromCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(removeFromCart),
      switchMap(({ cartItemId }) =>
        this.withLoggedInUser('Could not remove the item. Please try again.', () =>
          this.cartService.removeCartItem(cartItemId).pipe(map(() => loadCart()))
        )
      )
    )
  );

  // "Clear cart": delete every row (all delete requests are sent together)
  clearCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(clearCart),
      switchMap(() =>
        this.withLoggedInUser('Could not clear your cart. Please try again.', user =>

          this.cartService.getCart(user.id).pipe(
            switchMap((cartItems): Observable<Action> => {
              const rows = cartItems.filter(item => item.id);

              // forkJoin needs at least one request, so an empty cart is handled first
              if (rows.length === 0) {
                return of(loadCart());
              }

              const deleteRequests = rows.map(item => this.cartService.removeCartItem(item.id!));

              return forkJoin(deleteRequests).pipe(map(() => loadCart()));
            })
          )
        )
      )
    )
  );


  loadGuestCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadGuestCart),
      map(() => loadGuestCartSuccess({ items: this.guestCartService.getCart() }))
    )
  );


  addGuestCartItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(addGuestCartItem),
      switchMap(({ productId, variantId, size }) =>
        this.products$.pipe(
          map(products => {

            const product = products[productId];
            const stock = product ? getSizeStock(product, variantId, size) : Number.MAX_SAFE_INTEGER;

            const guestItems = this.guestCartService.getCart();
            const check = evaluateAddToCart(guestItems, productId, variantId, size, stock);

            if (check.allowed) {
              this.guestCartService.addItem({
                id: makeCartItemId(productId, variantId, size),
                productId,
                variantId,
                size,
                quantity: 1
              });
            } else {
              this.toast.warning(check.message);
            }

            // Step 4: reload (this also undoes the reducer's change when it was blocked)
            return loadGuestCart();
          })
        )
      )
    )
  );

  // "+" button
  increaseGuestQuantity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(increaseGuestQuantity),
      switchMap(({ cartItemId }): Observable<Action> => {
        const row = this.guestCartService.getCart().find(item => item.id === cartItemId);

        if (!row) {
          return of(loadGuestCart());
        }

        return this.checkCanIncrease(row).pipe(
          map(({ limit, stock }) => {
            if (limit === 'OK') {
              this.guestCartService.updateQuantity(cartItemId, row.quantity + 1);
            } else {
              this.toast.warning(quantityLimitMessage(limit, stock));
            }
            return loadGuestCart();
          })
        );
      })
    )
  );

  // "-" button  (updateQuantity deletes the row when the quantity becomes 0)
  decreaseGuestQuantity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(decreaseGuestQuantity),
      map(({ cartItemId }) => {
        const row = this.guestCartService.getCart().find(item => item.id === cartItemId);

        if (row) {
          this.guestCartService.updateQuantity(cartItemId, row.quantity - 1);
        }

        return loadGuestCart();
      })
    )
  );

  // "Remove" link
  removeGuestItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(removeGuestItem),
      map(({ cartItemId }) => {
        this.guestCartService.removeItem(cartItemId);
        return loadGuestCart();
      })
    )
  );

  // "Clear cart"
  clearGuestCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(clearGuestCart),
      map(() => {
        this.guestCartService.clearCart();
        return loadGuestCart();
      })
    )
  );



  private prepareMergeRequests(
    userId: string,
    guestItems: GuestCartItem[],
    accountItems: CartItem[]
  ) {
    const maxPerItem = MAX_PER_ITEM;

  
    const cartRows: CartLine[] = [...accountItems];


    const requests: Observable<unknown>[] = [];

    let wasReduced = false;

    for (const guestItem of guestItems) {
      const existingRow = findCartLine(
        accountItems,
        guestItem.productId,
        guestItem.variantId,
        guestItem.size
      );

      if (existingRow) {
        // CASE 1
        const freeSpace = Math.max(0, maxPerItem - existingRow.quantity);
        const quantityToAdd = Math.min(guestItem.quantity, freeSpace);

        if (quantityToAdd < guestItem.quantity) {
          wasReduced = true;
        }

        if (quantityToAdd > 0) {
          requests.push(
            this.cartService.updateCartItem(existingRow.id!, existingRow.quantity + quantityToAdd)
          );
        } else {
          requests.push(of(null));
        }

      } else if (isOverProductLimit(cartRows, guestItem.productId)) {
        // CASE 2
        wasReduced = true;
        requests.push(of(null));

      } else {
        // CASE 3
        const quantity = Math.min(guestItem.quantity, maxPerItem);

        if (quantity < guestItem.quantity) {
          wasReduced = true;
        }

        cartRows.push({ ...guestItem, quantity });

        requests.push(
          this.cartService.addCartItem({
            id: makeCartItemId(guestItem.productId, guestItem.variantId, guestItem.size),
            userId,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            size: guestItem.size,
            quantity
          })
        );
      }
    }

    return { requests, wasReduced };
  }

  mergeGuestCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(mergeGuestCart),
      switchMap(({ returnUrl }) =>
        this.store.select(selectCurrentUser).pipe(
          take(1),
          switchMap((user): Observable<Action> => {

            // Nobody is logged in -> cannot merge
            if (!user) {
              return of(
                mergeGuestCartFailure({ error: 'Cannot merge cart without a logged-in user', returnUrl })
              );
            }

            // The guest cart is empty -> nothing to merge
            const guestItems = this.guestCartService.getCart();

            if (guestItems.length === 0) {
              return of(mergeGuestCartSuccess({ returnUrl }));
            }

            // Step 1: get the account cart
            return this.cartService.getCart(user.id).pipe(

              // Step 2: prepare the requests (the 3 cases above)
              switchMap(accountItems => {
                const { requests, wasReduced } = this.prepareMergeRequests(
                  user.id,
                  guestItems,
                  accountItems
                );

                // Step 3: send all requests together and wait until all are done
                return forkJoin(requests).pipe(

                  // Step 4: the guest cart is no longer needed; tell the user if items were reduced
                  tap(() => {
                    this.guestCartService.clearCart();

                    if (wasReduced) {
                      this.toast.info(CART_MERGE_TRIMMED_MESSAGE);
                    }
                  }),

                  // Step 5: the merge is finished
                  map(() => mergeGuestCartSuccess({ returnUrl }))
                );
              })
            );
          }),
          catchError(() =>
            of(
              mergeGuestCartFailure({
                error: 'Could not merge your guest cart. Please try again.',
                returnUrl
              })
            )
          )
        )
      )
    )
  );

  // The merge is finished -> show the real account cart
  loadCartAfterMerge$ = createEffect(() =>
    this.actions$.pipe(
      ofType(mergeGuestCartSuccess),
      map(() => loadCart())
    )
  );



  showCartError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loadCartFailure, mergeGuestCartFailure),
        tap(({ error }) => this.toast.error(error))
      ),
    { dispatch: false }
  );
}