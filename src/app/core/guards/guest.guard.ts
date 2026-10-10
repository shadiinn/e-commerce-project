import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';

import { selectIsAuthenticated } from '../../store/auth/auth.selectors';

export const guestGuard: CanActivateFn = () => {

  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map(isAuthenticated => {

      if (isAuthenticated) {
        return router.createUrlTree(['/']);
      }

      // An administrator is not a storefront customer.
      // The admin is redirected separately by customerOnlyGuard when already signed in.

      return true;
    })
  );
};