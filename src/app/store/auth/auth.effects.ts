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

  updateProfile,
  updateProfileSuccess,
  updateProfileFailure,

  restoreAuth,
  restoreAuthSuccess,

  logout,
  registrationEmailAvailable,
  checkRegistrationEmail
} from './auth.actions';

import {
  catchError,
  filter,
  map,
  of,
  switchMap,
  tap
} from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

import { AuthStorageService } from '../../core/services/auth-storage.service';

import {
  AuthUser
} from '../../core/models/auth-user.model';

import {
  Router
} from '@angular/router';

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

  private actions$ = inject(Actions);

  private router = inject(Router);

  private authService = inject(AuthService);

  private authStorage = inject(AuthStorageService);


  // =====================================================
  // LOGIN
  // =====================================================

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(login),

      switchMap(({ email, password, loginMode, returnUrl }) =>
        this.authService.login(email, password).pipe(
          map(users => {
            const user = users.find(
              candidate => candidate.password === password
            );

            // Invalid credentials
            if (!user) {
              return loginFailure({
                error: 'Invalid email or password'
              });
            }

            // Account is inactive
            if (user.active === false) {
              return loginFailure({
                error:
                  'This account has been deactivated by the admin. Please contact the store administrator for assistance.'
              });
            }

            // Reject the wrong role for the selected login page.
            if (
              (loginMode === 'admin' && user.role !== 'admin') ||
              (loginMode === 'customer' && user.role !== 'customer')
            ) {
              const error =
                loginMode === 'admin'
                  ? 'Please use the customer login page.This account does not have administrator access. '
                  : 'Please use the admin login page.This account is for administrators. ';

              return loginFailure({ error });
            }

            // Only save the user after credentials and role are validated.
            const authUser: AuthUser = {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              profileImage: user.profileImage,
              role: user.role,
              active: user.active ?? true
            };

            this.authStorage.saveUser(authUser);

            return loginSuccess({
              user: authUser,
              returnUrl:
                loginMode === 'admin'
                  ? '/admin'
                  : returnUrl || '/home'
            });
          }),

          catchError(error =>
            of(
              loginFailure({
                error: error.message ?? 'Login failed'
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

      switchMap(({ user }) =>

        this.authService
          .checkEmailExists(user.email)
          .pipe(

            switchMap(users => {

              // Email already exists

              if (users.length > 0) {

                return of(

                  registerFailure({

                    error:
                      'An account with this email already exists.'

                  })

                );

              }


              // Email does not exist

              return this.authService
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

                );

            }),


            catchError(error =>

              of(

                registerFailure({

                  error:
                    error.message ??
                    'Unable to verify email'

                })

              )

            )

          )

      )

    )

  );


  // =====================================================
  // UPDATE PROFILE
  // =====================================================

  updateProfile$ = createEffect(() =>

    this.actions$.pipe(

      ofType(updateProfile),

      switchMap(
        ({
          id,
          changes
        }) =>

          this.authService
            .updateUser(id, changes)
            .pipe(

              map(user => {

                const authUser: AuthUser = {

                  id: user.id,

                  firstName: user.firstName,

                  lastName: user.lastName,

                  email: user.email,

                  phone: user.phone,

                  profileImage:
                    user.profileImage,

                  role: user.role,
                  active: user.active !== false

                };


                this.authStorage.saveUser(
                  authUser
                );


                return updateProfileSuccess({

                  user: authUser

                });

              }),


              catchError(error =>

                of(

                  updateProfileFailure({

                    error:
                      error.message ??
                      'Unable to update profile'

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
          this.authStorage.getUser();


        return restoreAuthSuccess({
          user
        });

      })

    )

  );


  // =====================================================
  // LOGOUT
  // =====================================================

  logout$ = createEffect(() =>

    this.actions$.pipe(

      ofType(logout),

      tap(() => {

        this.authStorage.clearUser();

      })

    ),

    {
      dispatch: false
    }

  );


  // Administrators go straight to the admin area and never merge a customer cart.
  loginAdminNavigation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess),
      filter(({ user }) => user.role === 'admin'),
      tap(() => this.router.navigateByUrl('/admin/dashboard'))
    ), { dispatch: false }
  );

  // =====================================================
  // CUSTOMER LOGIN → MERGE GUEST CART
  // =====================================================

  loginSuccessMergeCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess),
      filter(({ user }) => user.role !== 'admin'),
      map(({ returnUrl }) => mergeGuestCart({ returnUrl }))
    )
  );


  // =====================================================
  // CART MERGE SUCCESS → MERGE GUEST WISHLIST
  // =====================================================

  loginSuccessMergeWishlist$ = createEffect(() =>

    this.actions$.pipe(

      ofType(mergeGuestCartSuccess),

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
    createEffect(() =>

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

  checkRegistrationEmail$ = createEffect(() =>
    this.actions$.pipe(

      ofType(checkRegistrationEmail),

      switchMap(({ email }) =>

        this.authService
          .checkEmailExists(email)
          .pipe(

            switchMap(users => {

              if (users.length > 0) {

                return of(
                  registerFailure({
                    error:
                      'An account with this email already exists.'
                  })
                );

              }

              return of(
                registrationEmailAvailable({
                  email
                })
              );

            }),

            catchError(error =>
              of(
                registerFailure({
                  error:
                    error.message ??
                    'Unable to verify email'
                })
              )
            )

          )

      )

    )
  );

}