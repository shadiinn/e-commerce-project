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
  loadProductsSuccess
} from '../products/products.actions';

import {
  loadWishlist,
  loadWishlistSuccess,
  loadWishlistFailure,
  toggleWishlist,
  clearWishlist
} from './wishlist.actions';

import { WishlistService } from '../../core/services/wishlist.service';

import { WishlistItem } from '../../core/models/wishlist.model';


@Injectable()
export class WishlistEffects {

  private actions$ =
    inject(Actions);

  private wishlistService =
    inject(WishlistService);


  // =====================================================
  // LOAD WISHLIST AFTER PRODUCTS LOAD
  // =====================================================

  loadWishlistAfterProducts$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(
          loadProductsSuccess
        ),

        map(() =>
          loadWishlist()
        )

      )

    );


  // =====================================================
  // LOAD WISHLIST
  // =====================================================

  loadWishlist$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(
          loadWishlist
        ),

        switchMap(() =>

          this.wishlistService
            .getWishlist()
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

            )

        )

      )

    );


  // =====================================================
  // TOGGLE WISHLIST
  // =====================================================

  toggleWishlist$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(
          toggleWishlist
        ),

        concatMap(
          ({ product }) => {

            return this.wishlistService
              .getWishlist()
              .pipe(

                switchMap(items => {

                  const existingItem =
                    items.find(
                      item =>
                        item.productId ===
                        product.id
                    );


                  // =====================================
                  // REMOVE
                  // =====================================

                  if (existingItem) {

                    return this.wishlistService
                      .removeWishlistItem(
                        existingItem.id
                      );

                  }


                  // =====================================
                  // ADD
                  // =====================================

                  const wishlistItem:
                    WishlistItem = {

                    id: product.id,

                    productId:
                      product.id

                  };


                  return this.wishlistService
                    .addWishlistItem(
                      wishlistItem
                    );

                }),

                map(() =>
                  loadWishlist()
                ),

                catchError(error => {

                  console.error(
                    'Failed to update wishlist:',
                    error
                  );

                  return of(
                    loadWishlist()
                  );

                })

              );

          }

        )

      )

    );


  // =====================================================
  // CLEAR WISHLIST
  // =====================================================

  clearWishlist$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(
          clearWishlist
        ),

        concatMap(() =>

          this.wishlistService
            .getWishlist()
            .pipe(

              switchMap(items => {

                if (
                  items.length === 0
                ) {

                  return of(null);

                }


                return forkJoin(

                  items.map(item =>
                    this.wishlistService
                      .removeWishlistItem(
                        item.id
                      )
                  )

                );

              }),

              map(() =>
                loadWishlist()
              ),

              catchError(error => {

                console.error(
                  'Failed to clear wishlist:',
                  error
                );

                return of(
                  loadWishlist()
                );

              })

            )

        )

      )

    );

}