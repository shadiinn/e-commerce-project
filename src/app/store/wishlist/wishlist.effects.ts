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
  switchMap,
  take,
  tap
} from 'rxjs';

import {
  loadWishlist,
  loadWishlistSuccess,
  loadWishlistFailure,
  toggleWishlist,
  clearWishlist,
  resetWishlist
} from './wishlist.actions';

import { WishlistService } from '../../core/services/wishlist.service';

import { WishlistItem } from '../../core/models/wishlist.model';

import { Store } from '@ngrx/store';

import {
  selectCurrentUser
} from '../auth/auth.selectors';

import {
  loginSuccess,
  logout,
  restoreAuthSuccess
} from '../auth/auth.actions';


@Injectable()
export class WishlistEffects {

  private actions$ =
    inject(Actions);

  private wishlistService =
    inject(WishlistService);

  private store =
    inject(Store);


  // =====================================================
  // LOAD WISHLIST AFTER LOGIN / AUTH RESTORE
  // =====================================================

  loadWishlistAfterAuth$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        loginSuccess,
        restoreAuthSuccess
      ),

      map(() =>
        loadWishlist()
      )

    )

  );


  // =====================================================
  // RESET WISHLIST AFTER LOGOUT
  // =====================================================

  resetWishlistOnLogout$ = createEffect(() =>

    this.actions$.pipe(

      ofType(logout),

      map(() =>
        resetWishlist()
      )

    )

  );


  // =====================================================
  // LOAD CURRENT USER'S WISHLIST
  // =====================================================

  loadWishlist$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        loadWishlist
      ),

      switchMap(() =>

        this.store
          .select(selectCurrentUser)
          .pipe(

            // Get current user once
            take(1),

            switchMap(user => {

              // -----------------------------------------
              // NO USER
              // -----------------------------------------

              if (!user) {

                return of(
                  loadWishlistSuccess({
                    items: []
                  })
                );

              }


              // -----------------------------------------
              // LOAD USER'S WISHLIST
              // -----------------------------------------

              return this.wishlistService
                .getWishlist(user.id)
                .pipe(

                  map(items =>
                    loadWishlistSuccess({
                      items
                    })
                  ),

                  catchError(error =>
                    of(
                      loadWishlistFailure({
                        error:
                          error.message ??
                          'Failed to load wishlist'
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
  // TOGGLE WISHLIST
  // =====================================================

  toggleWishlist$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        toggleWishlist
      ),

      concatMap(
        ({ product }) =>

          this.store
            .select(selectCurrentUser)
            .pipe(

              // Get user once
              take(1),

              switchMap(user => {

                // ---------------------------------------
                // USER NOT AUTHENTICATED
                // ---------------------------------------

                if (!user) {

                  console.error(
                    'Cannot update wishlist: user is not authenticated.'
                  );

                  return of(null);

                }


                // ---------------------------------------
                // GET CURRENT USER'S WISHLIST
                // ---------------------------------------

                return this.wishlistService
                  .getWishlist(user.id)
                  .pipe(

                    switchMap(items => {

                      // ---------------------------------
                      // FIND PRODUCT
                      // ---------------------------------

                      const existingItem =
                        items.find(
                          item =>
                            item.productId ===
                            product.id
                        );


                      // ---------------------------------
                      // REMOVE
                      // ---------------------------------

                      if (existingItem) {

                        return this.wishlistService
                          .removeWishlistItem(
                            existingItem.id
                          );

                      }


                      // ---------------------------------
                      // ADD
                      // ---------------------------------

                      const wishlistItem:
                        WishlistItem = {

                        id: product.id,

                        userId: user.id,

                        productId:
                          product.id

                      };


                      return this.wishlistService
                        .addWishlistItem(
                          wishlistItem
                        );

                    }),

                    // -----------------------------------
                    // RELOAD AFTER SUCCESS
                    // -----------------------------------

                    tap(() => {

                      this.store.dispatch(
                        loadWishlist()
                      );

                    }),

                    catchError(error => {

                      console.error(
                        'Failed to update wishlist:',
                        error
                      );

                      return of(null);

                    })

                  );

              })

            )

      )

    ),

    {
      dispatch: false
    }

  );


  // =====================================================
  // CLEAR WISHLIST
  // =====================================================

  clearWishlist$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        clearWishlist
      ),

      concatMap(() =>

        this.store
          .select(selectCurrentUser)
          .pipe(

            take(1),

            switchMap(user => {

              // -----------------------------------------
              // NO USER
              // -----------------------------------------

              if (!user) {

                return of(null);

              }


              // -----------------------------------------
              // GET USER'S WISHLIST
              // -----------------------------------------

              return this.wishlistService
                .getWishlist(user.id)
                .pipe(

                  switchMap(items => {

                    // -------------------------------
                    // ALREADY EMPTY
                    // -------------------------------

                    if (items.length === 0) {

                      return of(null);

                    }


                    // -------------------------------
                    // DELETE ALL ITEMS
                    // -------------------------------

                    return forkJoin(

                      items.map(item =>
                        this.wishlistService
                          .removeWishlistItem(
                            item.id
                          )
                      )

                    );

                  }),

                  // -------------------------------
                  // RELOAD AFTER SUCCESS
                  // -------------------------------

                  tap(() => {

                    this.store.dispatch(
                      loadWishlist()
                    );

                  }),

                  catchError(error => {

                    console.error(
                      'Failed to clear wishlist:',
                      error
                    );

                    return of(null);

                  })

                );

            })

          )

      )

    ),

    {
      dispatch: false
    }

  );

}