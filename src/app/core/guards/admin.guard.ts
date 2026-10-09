import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { map, take } from 'rxjs';

export const adminGuard: CanMatchFn = (route, segments) => {

  const store = inject(Store);
  const router = inject(Router);
 
  return store.select(selectCurrentUser).pipe(
    take(1),
    map(user => {
 
      if (!user) {
        return router.createUrlTree(['/login'], {
          queryParams: { returnUrl: '/' + segments.join('/') }
        });
      }
 
      return user.role === 'admin' ? true : router.createUrlTree(['/']);
    })
  );
};
