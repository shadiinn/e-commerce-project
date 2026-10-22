import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';

import { selectCurrentUser } from '../../store/auth/auth.selectors';

export const authGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectCurrentUser).pipe(
    take(1),
    map(user => {
      if (user?.role === 'admin') return router.createUrlTree(['/admin']);
      if (user) return true;
      return router.createUrlTree(['/login'],{ queryParams: { returnUrl: state.url } });
    })
  );
};
