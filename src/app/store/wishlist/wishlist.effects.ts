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
  concat,
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
  resetWishlist,

  // Guest wishlist
  loadGuestWishlist,
  loadGuestWishlistSuccess,
  addGuestWishlistItem,
  removeGuestWishlistItem,
  clearGuestWishlist,
  mergeGuestWishlist,
  mergeGuestWishlistFailure,
  mergeGuestWishlistSuccess

} from './wishlist.actions';

import {
  WishlistService
} from '../../core/services/wishlist.service';

import {
  WishlistItem
} from '../../core/models/wishlist.model';

import {
  Store
} from '@ngrx/store';

import {
  selectCurrentUser
} from '../auth/auth.selectors';

import {
  logout,
  restoreAuthSuccess
} from '../auth/auth.actions';

import {
  GuestWishlistService
} from '../../core/services/guest-wishlist.service';


@Injectable()
export class WishlistEffects {

  private actions$ =
    inject(Actions);

  private wishlistService =
    inject(WishlistService);

  private store =
    inject(Store);

  private guestWishlistService =
    inject(GuestWishlistService);


  // =====================================================
  // LOAD WISHLIST AFTER AUTH RESTORE
  // =====================================================

  loadWishlistAfterAuth$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
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

      ofType(
        logout
      ),

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

      concatMap(({ product }) =>

        this.store
          .select(selectCurrentUser)
          .pipe(

            take(1),

            switchMap(user => {

              // =================================================
              // GUEST USER
              // =================================================

              if (!user) {

                const guestWishlist =
                  this.guestWishlistService
                    .getWishlist();

                const isAlreadyInWishlist =
                  guestWishlist.includes(
                    product.id
                  );


                // -----------------------------------------------
                // REMOVE FROM GUEST WISHLIST
                // -----------------------------------------------

                if (isAlreadyInWishlist) {

                  return of(
                    removeGuestWishlistItem({
                      productId: product.id
                    })
                  );

                }


                // -----------------------------------------------
                // ADD TO GUEST WISHLIST
                // -----------------------------------------------

                return of(
                  addGuestWishlistItem({
                    productId: product.id
                  })
                );

              }


              // =================================================
              // AUTHENTICATED USER
              // =================================================

              return this.wishlistService
                .getWishlist(user.id)
                .pipe(

                  switchMap(items => {

                    // -------------------------------------------
                    // FIND EXISTING ITEM
                    // -------------------------------------------

                    const existingItem =
                      items.find(
                        item =>
                          item.productId ===
                          product.id
                      );


                    // -------------------------------------------
                    // REMOVE
                    // -------------------------------------------

                    if (existingItem) {

                      return this.wishlistService
                        .removeWishlistItem(
                          existingItem.id
                        )
                        .pipe(

                          map(() =>
                            loadWishlist()
                          )

                        );

                    }


                    // -------------------------------------------
                    // ADD
                    // -------------------------------------------

                    const wishlistItem:
                      WishlistItem = {

                      id:
                        product.id,

                      userId:
                        user.id,

                      productId:
                        product.id

                    };


                    return this.wishlistService
                      .addWishlistItem(
                        wishlistItem
                      )
                      .pipe(

                        map(() =>
                          loadWishlist()
                        )

                      );

                  }),

                  catchError(error => {

                    console.error(
                      'Failed to update wishlist:',
                      error
                    );

                    return of(
                      loadWishlistFailure({
                        error:
                          error.message ??
                          'Failed to update wishlist'
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
  // LOAD GUEST WISHLIST
  // =====================================================

  loadGuestWishlist$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        loadGuestWishlist
      ),

      map(() => {

        const items =
          this.guestWishlistService
            .getWishlist();

        return loadGuestWishlistSuccess({
          items
        });

      })

    )

  );


  // =====================================================
  // ADD GUEST WISHLIST ITEM
  // =====================================================

  addGuestWishlistItem$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        addGuestWishlistItem
      ),

      tap(({ productId }) => {

        this.guestWishlistService
          .addItem(productId);

      }),

      map(() =>
        loadGuestWishlist()
      )

    )

  );


  // =====================================================
  // REMOVE GUEST WISHLIST ITEM
  // =====================================================

  removeGuestWishlistItem$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        removeGuestWishlistItem
      ),

      tap(({ productId }) => {

        this.guestWishlistService
          .removeItem(productId);

      }),

      map(() =>
        loadGuestWishlist()
      )

    )

  );


  // =====================================================
  // CLEAR GUEST WISHLIST
  // =====================================================

  clearGuestWishlist$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        clearGuestWishlist
      ),

      tap(() => {

        this.guestWishlistService
          .clearWishlist();

      }),

      map(() =>
        loadGuestWishlist()
      )

    )

  );


  // =====================================================
  // MERGE GUEST WISHLIST
  // =====================================================

  mergeGuestWishlist$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        mergeGuestWishlist
      ),

      switchMap(({ returnUrl }) =>

        this.store
          .select(selectCurrentUser)
          .pipe(

            take(1),

            switchMap(user => {

              // =================================================
              // USER MUST BE LOGGED IN
              // =================================================

              if (!user) {

                return of(
                  mergeGuestWishlistFailure({
                    error:
                      'Cannot merge wishlist without a logged-in user',
                    returnUrl
                  })
                );

              }


              // =================================================
              // GET GUEST WISHLIST
              // =================================================

              const guestItems =
                this.guestWishlistService
                  .getWishlist();


              // =================================================
              // NOTHING TO MERGE
              // =================================================

              if (guestItems.length === 0) {

                return this.wishlistService
                  .getWishlist(user.id)
                  .pipe(

                    switchMap(items =>

                      concat(

                        // First update NgRx state
                        of(
                          loadWishlistSuccess({
                            items
                          })
                        ),

                        // Then continue login flow
                        of(
                          mergeGuestWishlistSuccess({
                            returnUrl
                          })
                        )

                      )

                    ),

                    catchError(error =>

                      of(
                        mergeGuestWishlistFailure({
                          error:
                            error.message ??
                            'Failed to load wishlist',
                          returnUrl
                        })
                      )

                    )

                  );

              }


              // =================================================
              // GET USER'S EXISTING WISHLIST
              // =================================================

              return this.wishlistService
                .getWishlist(user.id)
                .pipe(

                  switchMap(userWishlist => {

                    // -------------------------------------------
                    // FIND EXISTING PRODUCT IDS
                    // -------------------------------------------

                    const existingProductIds =
                      new Set(
                        userWishlist.map(
                          item =>
                            item.productId
                        )
                      );


                    // -------------------------------------------
                    // FIND PRODUCTS TO ADD
                    // -------------------------------------------

                    const productsToAdd =
                      guestItems.filter(
                        productId =>
                          !existingProductIds.has(
                            productId
                          )
                      );


                    // =================================================
                    // NOTHING NEW TO ADD
                    // =================================================

                    if (productsToAdd.length === 0) {

                      this.guestWishlistService
                        .clearWishlist();

                      return this.wishlistService
                        .getWishlist(user.id)
                        .pipe(

                          switchMap(items =>

                            concat(

                              // Update NgRx state first
                              of(
                                loadWishlistSuccess({
                                  items
                                })
                              ),

                              // Then continue login flow
                              of(
                                mergeGuestWishlistSuccess({
                                  returnUrl
                                })
                              )

                            )

                          )

                        );

                    }


                    // =================================================
                    // CREATE WISHLIST ITEMS
                    // =================================================

                    const requests =
                      productsToAdd.map(
                        productId => {

                          const wishlistItem:
                            WishlistItem = {

                            id:
                              productId,

                            userId:
                              user.id,

                            productId

                          };


                          return this.wishlistService
                            .addWishlistItem(
                              wishlistItem
                            );

                        }
                      );


                    // =================================================
                    // ADD ALL ITEMS
                    // =================================================

                    return forkJoin(
                      requests
                    ).pipe(

                      tap(() => {

                        console.log(
                          'GUEST WISHLIST MERGED SUCCESSFULLY'
                        );

                        this.guestWishlistService
                          .clearWishlist();

                      }),


                      // =================================================
                      // RELOAD BACKEND WISHLIST
                      // =================================================

                      switchMap(() =>

                        this.wishlistService
                          .getWishlist(
                            user.id
                          )

                      ),


                      // =================================================
                      // UPDATE STORE FIRST
                      // THEN SIGNAL MERGE SUCCESS
                      // =================================================

                      switchMap(items =>

                        concat(

                          of(
                            loadWishlistSuccess({
                              items
                            })
                          ),

                          of(
                            mergeGuestWishlistSuccess({
                              returnUrl
                            })
                          )

                        )

                      )

                    );

                  }),

                  catchError(error => {

                    console.error(
                      'Failed to merge guest wishlist:',
                      error
                    );

                    return of(
                      mergeGuestWishlistFailure({
                        error:
                          error.message ??
                          'Failed to merge guest wishlist',
                        returnUrl
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
  // CLEAR AUTHENTICATED WISHLIST
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

                    // ---------------------------------
                    // ALREADY EMPTY
                    // ---------------------------------

                    if (items.length === 0) {

                      return of(null);

                    }


                    // ---------------------------------
                    // DELETE ALL ITEMS
                    // ---------------------------------

                    return forkJoin(

                      items.map(item =>

                        this.wishlistService
                          .removeWishlistItem(
                            item.id
                          )

                      )

                    );

                  }),


                  // ---------------------------------
                  // RELOAD AFTER SUCCESS
                  // ---------------------------------

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