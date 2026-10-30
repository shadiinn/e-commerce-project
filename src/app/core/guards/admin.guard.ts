import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';

import { selectCurrentUser } from '../../store/auth/auth.selectors';

export const adminGuard: CanMatchFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectCurrentUser).pipe(
    take(1),

    map(user => {
      if (!user) {
        return router.createUrlTree(['/admin/login']);
      }

      if (user.role !== 'admin') {
        return router.createUrlTree(['/home']);
      }

      return true;
    })
  );
};