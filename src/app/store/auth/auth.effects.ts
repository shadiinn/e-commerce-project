import { Injectable, inject } from '@angular/core';

import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import {
  login,
  loginSuccess,
  loginFailure,
  register,
  registerSuccess,
  registerFailure,
  restoreAuth,
  restoreAuthSuccess,
  logout
} from './auth.actions';

import { AuthService } from '../../core/services/auth.service';

import {
  catchError,
  map,
  of,
  switchMap,
  tap
} from 'rxjs';

import { AuthStorageService } from '../../core/services/auth-storage.service';

import { AuthUser } from '../../core/models/auth-user.model';

import { Router } from '@angular/router';

import {
  mergeGuestCart,
  mergeGuestCartSuccess
} from '../cart/cart.actions';

import {
  mergeGuestWishlist,
  mergeGuestWishlistSuccess
} from '../wishlist/wishlist.actions';


@Injectable()
export class AuthEffects {

  private actions$ =
    inject(Actions);

  private router =
    inject(Router);

  private authService =
    inject(AuthService);

  private authStorage =
    inject(AuthStorageService);


  // =====================================================
  // LOGIN
  // =====================================================

  login$ = createEffect(() =>

    this.actions$.pipe(

      ofType(login),

      switchMap(
        ({
          email,
          password,
          returnUrl
        }) =>

          this.authService
            .login(
              email,
              password
            )
            .pipe(

              map(users => {

                if (users.length === 0) {

                  return loginFailure({
                    error:
                      'Invalid email or password'
                  });

                }

                const user =
                  users[0];

                const authUser:
                  AuthUser = {

                  id:
                    user.id,

                  firstName:
                    user.firstName,

                  lastName:
                    user.lastName,

                  email:
                    user.email,

                  phone:
                    user.phone

                };

                this.authStorage
                  .saveUser(
                    authUser
                  );

                return loginSuccess({

                  user:
                    authUser,

                  returnUrl

                });

              }),

              catchError(error =>

                of(

                  loginFailure({

                    error:
                      error.message ??
                      'Login failed'

                  })

                )

              )

            )

      )

    )

  );


  // =====================================================
  // REGISTER
  // =====================================================

  register$ = createEffect(() =>

    this.actions$.pipe(

      ofType(register),

      switchMap(
        ({ user }) =>

          this.authService
            .register(user)
            .pipe(

              map(() =>
                registerSuccess()
              ),

              catchError(error =>

                of(

                  registerFailure({

                    error:
                      error.message ??
                      'Registration failed'

                  })

                )

              )

            )

      )

    )

  );


  // =====================================================
  // RESTORE AUTH
  // =====================================================

  restoreAuth$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        restoreAuth
      ),

      map(() => {

        const user =
          this.authStorage
            .getUser();

        return restoreAuthSuccess({

          user

        });

      })

    )

  );


  // =====================================================
  // LOGOUT
  // =====================================================

  logout$ = createEffect(

    () =>

      this.actions$.pipe(

        ofType(logout),

        tap(() => {

          this.authStorage
            .clearUser();

        })

      ),

    {
      dispatch: false
    }

  );


  // =====================================================
  // REGISTER SUCCESS NAVIGATION
  // =====================================================

  registerSuccessNavigation$ =
    createEffect(

      () =>

        this.actions$.pipe(

          ofType(
            registerSuccess
          ),

          tap(() => {

            this.router.navigate([
              '/login'
            ]);

          })

        ),

      {
        dispatch: false
      }

    );


  // =====================================================
  // LOGIN → MERGE GUEST CART
  // =====================================================

  loginSuccessMergeCart$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(
          loginSuccess
        ),

        map(({ returnUrl }) =>

          mergeGuestCart({

            returnUrl

          })

        )

      )

    );


  // =====================================================
  // CART MERGE SUCCESS → MERGE GUEST WISHLIST
  // =====================================================

  loginSuccessMergeWishlist$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(
          mergeGuestCartSuccess
        ),

        map(({ returnUrl }) =>

          mergeGuestWishlist({

            returnUrl

          })

        )

      )

    );


  // =====================================================
  // WISHLIST MERGE SUCCESS → NAVIGATE
  // =====================================================

  mergeGuestWishlistSuccessNavigation$ =
    createEffect(

      () =>

        this.actions$.pipe(

          ofType(
            mergeGuestWishlistSuccess
          ),

          tap(({ returnUrl }) => {

            this.router.navigateByUrl(

              returnUrl || '/'

            );

          })

        ),

      {
        dispatch: false
      }

    );

}